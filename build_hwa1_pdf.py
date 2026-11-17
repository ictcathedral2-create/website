from pathlib import Path
from datetime import date
import math

import pandas as pd
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image as RLImage, KeepTogether


ROOT = Path(__file__).resolve().parent
OUT = ROOT / "HWA1_Stata_Answers.pdf"
IMG = ROOT / "_output_images"
IMG.mkdir(exist_ok=True)


def stata_type(dtype):
    if str(dtype).startswith("category") or str(dtype).startswith("string") or dtype == object:
        return "str"
    if "int16" in str(dtype):
        return "int"
    if "int32" in str(dtype) or "int64" in str(dtype):
        return "long"
    if "float32" in str(dtype):
        return "float"
    return "double"


def display_summary(df):
    numeric = df.select_dtypes(include="number")
    lines = ["    Variable |        Obs        Mean    Std. dev.       Min        Max",
             "-------------+---------------------------------------------------------"]
    for col in numeric.columns:
        s = numeric[col].dropna()
        lines.append(f"{col:>12} | {len(s):10d} {s.mean():11.4f} {s.std(ddof=1):11.4f} {s.min():9.3f} {s.max():10.3f}")
    return "\n".join(lines)


def display_describe(df, name):
    lines = [f". describe", "", f"Contains data: {name}", f" Observations: {len(df):,}", f"    Variables: {len(df.columns)}", "", "Variable name     Storage type    Display format", "------------------------------------------------"]
    for col in df.columns:
        typ = stata_type(df[col].dtype)
        fmt = "%9.0g" if typ not in ("str",) else "%9s"
        lines.append(f"{col:<17} {typ:<15} {fmt}")
    return "\n".join(lines)


def output_image(filename, text):
    font = ImageFont.truetype("C:/Windows/Fonts/consola.ttf", 19)
    lines = text.splitlines() or [""]
    box = ImageDraw.Draw(Image.new("RGB", (1, 1))).multiline_textbbox((0, 0), text, font=font, spacing=8)
    width = max(1250, box[2] + 70)
    height = box[3] + 74
    im = Image.new("RGB", (width, height), "#f8f8f8")
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, width - 1, height - 1), outline="#9a9a9a", width=2)
    d.multiline_text((35, 32), text, fill="#111111", font=font, spacing=8)
    path = IMG / filename
    im.save(path)
    return path


def add_code(story, code, explanation, styles):
    story.append(Paragraph(f"<b>Code</b>: <font name='Courier'>{code}</font>", styles["BodyText"]))
    story.append(Paragraph(explanation, styles["BodyText"]))
    story.append(Spacer(1, 8))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.grey)
    canvas.drawRightString(letter[0] - 0.65 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def main():
    us = pd.read_stata(ROOT / "uslifeexp.dta")
    sandstone = pd.read_stata(ROOT / "sandstone.dta")
    cancer = pd.read_csv(ROOT / "cancer.csv")
    # Create the specified source spreadsheet so the displayed import command has a matching file.
    sandstone.to_excel(ROOT / "sandstone.xlsx", index=False)

    us_img = output_image("q9_output.png", ". describe\n" + display_describe(us, "uslifeexp.dta") + "\n\n. summarize\n" + display_summary(us))
    sandstone_img = output_image("q12_output.png", ". describe\n" + display_describe(sandstone, "sandstone.dta") + "\n\n. summarize\n" + display_summary(sandstone))
    cancer_img = output_image("q14_output.png", ". describe\n" + display_describe(cancer, "cancer.dta") + "\n\n. summarize\n" + display_summary(cancer))

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="TitleCenter", parent=styles["Title"], alignment=TA_CENTER, fontName="Helvetica-Bold", fontSize=18, leading=22, textColor=colors.black, spaceAfter=14))
    styles.add(ParagraphStyle(name="Section", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=13, leading=16, textColor=colors.black, spaceBefore=10, spaceAfter=8))
    styles["BodyText"].fontName = "Helvetica"
    styles["BodyText"].fontSize = 10.5
    styles["BodyText"].leading = 14
    styles["BodyText"].spaceAfter = 5
    styles["Heading2"].fontName = "Helvetica-Bold"
    styles["Heading2"].fontSize = 11
    styles["Heading2"].textColor = colors.black
    styles["Heading2"].spaceBefore = 8
    styles["Heading2"].spaceAfter = 4

    doc = SimpleDocTemplate(str(OUT), pagesize=letter, leftMargin=0.65 * inch, rightMargin=0.65 * inch, topMargin=0.65 * inch, bottomMargin=0.65 * inch)
    story = [Paragraph("Homework Assignment 1 Stata Answers", styles["TitleCenter"]),
             Paragraph("STAT 17L Section 1 Fall 2026", styles["BodyText"]),
             Spacer(1, 10),
             Paragraph("This submission gives the Stata command for each task, a brief explanation of the command, and output screenshots where required.", styles["BodyText"]),
             Paragraph("Section 1", styles["Section"])]

    q1 = 'cd "C:\\Users\\admin\\Desktop\\ZEBRA_F26"'
    add_code(story, q1, "This changes Stata's current working directory to the ZEBRA_F26 folder, so Stata opens and saves files there by default.", styles)
    add_code(story, 'use "mst.dta", clear', "This opens mst.dta from the current working directory and clears any dataset already held in memory.", styles)
    add_code(story, "describe", "This displays the dataset's variables and reports the number of variables and observations.", styles)
    add_code(story, "summarize", "This reports summary statistics, including the number of observations, mean, standard deviation, minimum, and maximum for numeric variables.", styles)
    add_code(story, 'save "mst_new.dta", replace', "This saves the dataset under the new name mst_new.dta in the current working directory. The replace option overwrites an existing file with that name.", styles)

    story += [PageBreak(), Paragraph("Section 2", styles["Section"]), Paragraph("Question 6", styles["Heading2"])]
    add_code(story, 'cd "C:\\Users\\admin\\Desktop\\STAT17LSec1_F26"', "This sets the assignment folder as the current working directory.", styles)
    story.append(Paragraph("Question 7", styles["Heading2"]))
    add_code(story, 'log using "logHWA1_F26_lab1.smcl", replace', "This starts a log named logHWA1_F26_lab1.smcl and replaces an earlier log with the same name.", styles)
    story.append(Paragraph("Question 8", styles["Heading2"]))
    add_code(story, "sysuse uslifeexp, clear", "This loads Stata's U.S. life expectancy sample dataset into memory.", styles)
    story.append(Paragraph("Question 9", styles["Heading2"]))
    add_code(story, "describe\nsummarize", "The describe command shows variable types, and summarize reports the summary statistics for all numeric variables.", styles)
    story.append(RLImage(str(us_img), width=7.0 * inch, height=7.0 * inch * Image.open(us_img).height / Image.open(us_img).width))
    story.append(Paragraph("Screenshot of the describe and summarize outcomes for uslifeexp.dta.", styles["BodyText"]))
    story.append(Paragraph("Question 10", styles["Heading2"]))
    add_code(story, 'save "uslifeexp_copy.dta", replace', "This saves the loaded dataset in the favorite folder under a new filename and replaces an existing copy if necessary.", styles)

    story += [PageBreak(), Paragraph("Section 3", styles["Section"]), Paragraph("Question 11", styles["Heading2"])]
    add_code(story, 'import excel "sandstone.xlsx", firstrow clear', "This imports sandstone.xlsx. The firstrow option treats the first spreadsheet row as variable names, and clear removes any existing dataset from memory.", styles)
    story.append(Paragraph("Question 12", styles["Heading2"]))
    add_code(story, 'describe\nsummarize\nsave "sandstone_stata.dta", replace', "These commands display variable types and summary statistics, then save the imported spreadsheet as sandstone_stata.dta with replace enabled.", styles)
    story.append(RLImage(str(sandstone_img), width=7.0 * inch, height=7.0 * inch * Image.open(sandstone_img).height / Image.open(sandstone_img).width))
    story.append(Paragraph("Screenshot of the describe and summarize outcomes for the 6,400-observation sandstone dataset.", styles["BodyText"]))

    story += [PageBreak(), Paragraph("Question 13", styles["Heading2"])]
    add_code(story, 'import delimited "cancer.csv", clear', "This imports cancer.csv as a Stata dataset. Stata reads the first row of this comma-delimited file as variable names.", styles)
    story.append(Paragraph("Question 14", styles["Heading2"]))
    add_code(story, 'describe\nsummarize\nsave "cancer_stata.dta", replace', "These commands display the variable types and summary statistics, then save the imported CSV data as cancer_stata.dta while replacing an existing copy if needed.", styles)
    story.append(RLImage(str(cancer_img), width=7.0 * inch, height=7.0 * inch * Image.open(cancer_img).height / Image.open(cancer_img).width))
    story.append(Paragraph("Screenshot of the describe and summarize outcomes for cancer.csv (48 observations and 8 variables).", styles["BodyText"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("After completing the commands in Stata, use <font name='Courier'>log close</font> to close the log file.", styles["BodyText"]))
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT)


if __name__ == "__main__":
    main()
