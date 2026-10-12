// Every admin page, grouped as it appears in the sidebar.
//
// Submission sections (those with a `path`) are rendered generically by
// SubmissionSection. A column's `render` may return JSX for the screen; `csv`
// gives the plain-text value for exports (falls back to the raw value).

function normalizeUrl(url) {
    const trimmed = String(url || "").trim();
    if (!trimmed) return "";
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const fullName = (v, item) => `${item.firstName || ""} ${item.lastName || ""}`.trim();
const ksh = v => `KSh ${Number(v || 0).toLocaleString()}`;
const linkTo = label => v => v ? <a href={normalizeUrl(v)} target="_blank" rel="noreferrer">{label}</a> : "—";

export const GROUPS = ["Overview", "Content", "Inbox", "People", "Community", "Giving", "Settings"];

export const SECTIONS = [
    { key: "overview", label: "Overview", group: "Overview", icon: "home", type: "overview" },

    // ── Content shown on the website and app ──
    { key: "events", label: "Events", group: "Content", icon: "calendar", type: "events" },
    { key: "gallery", label: "Posters & Photos", group: "Content", icon: "image", type: "gallery" },
    { key: "writtenSermons", label: "Written Sermons", group: "Content", icon: "book", type: "writtenSermons" },
    { key: "sermonGallery", label: "Sermon Photos", group: "Content", icon: "camera", type: "sermonGallery" },

    // ── Messages that need a reply ──
    {
        key: "support", label: "Support Chats", group: "Inbox", icon: "chat", type: "support",
        rawPath: "supportChats", pendingStatus: "new", pendingLabel: "awaiting a reply",
    },
    {
        key: "contactMessages", label: "Contact Messages", group: "Inbox", icon: "mail",
        path: "contactMessages",
        description: "Messages sent through the Connect page.",
        statusOptions: ["new", "responded", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: fullName },
            { key: "helpType", label: "Help Type" },
            { key: "email", label: "Email", render: v => v ? <a href={`mailto:${v}`}>{v}</a> : "—", csv: v => v },
            { key: "phone", label: "Phone", render: v => v ? <a href={`tel:${v}`}>{v}</a> : "—", csv: v => v },
            { key: "message", label: "Message", long: true },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "helpType", label: "Help Type", type: "select", options: ["I'm new and want to know more", "I'd like to join a ministry", "I need pastoral support", "Partnership or collaboration", "Other"] },
            { key: "message", label: "Message", type: "textarea" },
        ],
        pendingStatus: "new",
    },
    {
        key: "prayerRequests", label: "Prayer Requests", group: "Inbox", icon: "heart",
        path: "prayerRequests",
        statusOptions: ["new", "prayed", "archived"],
        columns: [
            { key: "name", label: "Name", render: (v, item) => (item.anonymous ? "Anonymous" : v || "—") },
            { key: "phone", label: "Phone", render: (v, item) => item.anonymous ? "Hidden" : (v || "—") },
            { key: "source", label: "Source" },
            { key: "request", label: "Request", long: true },
        ],
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "request", label: "Request", type: "textarea" },
            { key: "source", label: "Source", type: "text" },
        ],
        pendingStatus: "new",
    },

    // ── People signing up ──
    {
        key: "joinUsRegistrations", label: "Membership Sign-ups", group: "People", icon: "userPlus",
        path: "joinUsRegistrations",
        description: "People who registered through \"Become a Member\".",
        statusOptions: ["new", "contacted", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: fullName },
            { key: "phone", label: "Phone" },
            { key: "area", label: "Area" },
            { key: "gender", label: "Gender" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "area", label: "Area", type: "text" },
            { key: "gender", label: "Gender", type: "select", options: ["Male", "Female"] },
        ],
        pendingStatus: "new",
    },
    {
        key: "eventRegistrations", label: "Event Registrations", group: "People", icon: "ticket",
        path: "eventRegistrations",
        statusOptions: ["registered", "confirmed", "cancelled"],
        columns: [
            { key: "firstName", label: "Name", render: fullName },
            { key: "eventTitle", label: "Event" },
            { key: "phone", label: "Phone" },
            { key: "specialRequirements", label: "Notes", long: true },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "eventTitle", label: "Event", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "specialRequirements", label: "Notes", type: "textarea" },
        ],
        pendingStatus: "registered",
        pendingLabel: "not yet confirmed",
        groupByField: "eventTitle",
    },
    {
        key: "ministryRegistrations", label: "Ministry Sign-ups", group: "People", icon: "users",
        path: "ministryRegistrations",
        statusOptions: ["new", "contacted", "archived"],
        columns: [
            { key: "firstName", label: "Name", render: fullName },
            { key: "phone", label: "Phone" },
            { key: "ministryTitle", label: "Ministry" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "ministryTitle", label: "Ministry", type: "text" },
        ],
        pendingStatus: "new",
        groupByField: "ministryTitle",
        groupOptions: ["ICT Ministry", "Praise & Worship Ministry", "Care Ministry", "Ushering Ministry", "Intercessory Ministry", "Creative Ministry", "Merchandise Ministry", "Pastoral Ministry"],
    },
    {
        key: "smallGroupSignups", label: "Small Groups", group: "People", icon: "users",
        path: "smallGroupSignups",
        statusOptions: ["new", "assigned"],
        columns: [
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "preferredGroup", label: "Preferred Group" },
        ],
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "preferredGroup", label: "Preferred Group", type: "select", options: ["Bible Study (Sunday · 11:00 AM)", "Missions", "Men's Fellowship (Friday · 5:00 PM)"] },
        ],
        pendingStatus: "new",
        groupByField: "preferredGroup",
        groupOptions: ["Bible Study (Sunday · 11:00 AM)", "Missions", "Men's Fellowship (Friday · 5:00 PM)"],
    },
    {
        key: "newsletterSignups", label: "Newsletter", group: "People", icon: "megaphone",
        path: "newsletterSignups",
        statusOptions: ["new", "archived"],
        columns: [
            { key: "email", label: "Email" },
            { key: "source", label: "Source" },
        ],
        fields: [
            { key: "email", label: "Email", type: "text" },
            { key: "source", label: "Source", type: "text" },
        ],
        pendingStatus: "new",
        pendingLabel: "new subscribers",
    },

    // ── Community board (approved items appear publicly) ──
    {
        key: "testimonies", label: "Testimonies", group: "Community", icon: "star",
        path: "testimonies",
        description: "Approved testimonies appear on the Testimonies page.",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "title", label: "Title" },
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "story", label: "Story", long: true },
        ],
        fields: [
            { key: "name", label: "Name", type: "text" },
            { key: "title", label: "Title", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Testimony / Personal Story", "Devotional Article", "Scripture Reflection", "Youth Experience"] },
            { key: "story", label: "Story", type: "textarea" },
        ],
        pendingStatus: "pending",
        pendingLabel: "awaiting approval",
    },
    {
        key: "businessListings", label: "Businesses", group: "Community", icon: "store",
        path: "businessListings",
        description: "Approved businesses appear in the Business Directory.",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "businessName", label: "Business" },
            { key: "ownerName", label: "Owner" },
            { key: "phone", label: "Phone" },
            { key: "category", label: "Category" },
            { key: "websiteUrl", label: "Website", render: linkTo("Open link"), csv: v => v },
            {
                key: "mediaType", label: "Media", csv: (v, item) => (v === "video" ? item.mediaUrl : v === "image" ? "image" : ""),
                render: (v, item) => {
                    if (v === "image" && item.mediaData) return <img src={item.mediaData} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />;
                    if (v === "video" && item.mediaUrl) return <a href={item.mediaUrl} target="_blank" rel="noreferrer">Watch video</a>;
                    return "—";
                },
            },
            { key: "description", label: "Description", long: true },
        ],
        fields: [
            { key: "businessName", label: "Business Name", type: "text" },
            { key: "ownerName", label: "Owner Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Retail & Shops", "Food & Catering", "Services", "Agriculture", "Technology", "Fashion & Beauty", "Transport", "Other"] },
            { key: "description", label: "Description", type: "textarea" },
            { key: "showPhone", label: "Public Phone Number", type: "checkbox", helpText: "Show the owner's phone number on the public listing" },
            { key: "websiteUrl", label: "Website / Social Link", type: "text" },
        ],
        pendingStatus: "pending",
        pendingLabel: "awaiting approval",
    },
    {
        key: "jobPostings", label: "Job Posts", group: "Community", icon: "briefcase",
        path: "jobPostings",
        description: "Approved jobs appear on the Job Board.",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "jobTitle", label: "Job Title" },
            { key: "company", label: "Company" },
            { key: "jobType", label: "Type" },
            { key: "contactPhone", label: "Phone" },
            { key: "jobUrl", label: "Link", render: linkTo("Open link"), csv: v => v },
            {
                key: "advertType", label: "Advert", csv: v => v || "",
                render: (v, item) => {
                    if (v === "image" && item.advertData) return <img src={item.advertData} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />;
                    if (v === "pdf" && item.advertData) return <a href={item.advertData} target="_blank" rel="noreferrer">Open PDF</a>;
                    return "—";
                },
            },
            { key: "description", label: "Description", long: true },
        ],
        fields: [
            { key: "jobTitle", label: "Job Title", type: "text" },
            { key: "company", label: "Company / Organization", type: "text" },
            { key: "contactPhone", label: "Contact Phone", type: "text" },
            { key: "jobType", label: "Job Type", type: "select", options: ["Full-time", "Part-time", "Internship", "Volunteer", "Casual"] },
            { key: "description", label: "Description", type: "textarea" },
            { key: "showContactPhone", label: "Public Contact Phone", type: "checkbox", helpText: "Show the contact phone number on the public job post" },
            { key: "jobUrl", label: "Application Link / Website", type: "text" },
        ],
        pendingStatus: "pending",
        pendingLabel: "awaiting approval",
    },
    {
        key: "jobSeekers", label: "Job Seekers", group: "Community", icon: "search",
        path: "jobSeekers",
        description: "Approved job seekers appear on the Job Seekers page.",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "name", label: "Name" },
            { key: "desiredRole", label: "Looking For" },
            { key: "phone", label: "Phone" },
            { key: "cvData", label: "CV", render: v => v ? <a href={v} download="cv.pdf">Download CV</a> : "—", csv: v => (v ? "attached" : "") },
            { key: "bio", label: "Bio", long: true },
        ],
        fields: [
            { key: "name", label: "Full Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "desiredRole", label: "Desired Role / Field", type: "text" },
            { key: "bio", label: "Bio / Skills", type: "textarea" },
        ],
        pendingStatus: "pending",
        pendingLabel: "awaiting approval",
    },
    {
        key: "wantedPosts", label: "Requests", group: "Community", icon: "megaphone",
        path: "wantedPosts",
        description: "Approved requests appear on the Requests page.",
        statusOptions: ["pending", "approved", "rejected"],
        columns: [
            { key: "itemWanted", label: "Looking For" },
            { key: "name", label: "Name" },
            { key: "phone", label: "Phone" },
            { key: "description", label: "Description", long: true },
        ],
        fields: [
            { key: "name", label: "Full Name", type: "text" },
            { key: "phone", label: "Phone", type: "text" },
            { key: "itemWanted", label: "What They're Looking For", type: "text" },
            { key: "description", label: "Description", type: "textarea" },
        ],
        pendingStatus: "pending",
        pendingLabel: "awaiting approval",
    },

    // ── Giving ──
    {
        key: "mpesaTransactions", label: "M-Pesa Payments", group: "Giving", icon: "phone",
        path: "mpesaTransactions",
        statusOptions: ["pending", "completed", "failed"],
        columns: [
            { key: "amount", label: "Amount", render: ksh },
            { key: "phone", label: "Phone" },
            { key: "accountType", label: "Giving Towards" },
            { key: "mpesaReceiptNumber", label: "Receipt" },
        ],
        fields: [
            { key: "phone", label: "Phone", type: "text" },
            { key: "accountType", label: "Giving Towards", type: "text" },
            { key: "amount", label: "Amount (KSh)", type: "number" },
            { key: "mpesaReceiptNumber", label: "M-Pesa Receipt", type: "text" },
        ],
        pendingStatus: "pending",
    },
    {
        key: "givingRecords", label: "Giving Pledges", group: "Giving", icon: "gift",
        path: "givingRecords",
        statusOptions: ["new", "received"],
        columns: [
            { key: "firstName", label: "Name", render: fullName },
            { key: "amount", label: "Amount", render: ksh },
            { key: "category", label: "Category" },
            { key: "frequency", label: "Frequency" },
            { key: "email", label: "Email" },
        ],
        fields: [
            { key: "firstName", label: "First Name", type: "text" },
            { key: "lastName", label: "Last Name", type: "text" },
            { key: "email", label: "Email", type: "text" },
            { key: "category", label: "Category", type: "select", options: ["Tithes & Offerings", "Youth Ministry Fund", "Mission & Outreach", "Building Fund", "Scholarship Fund"] },
            { key: "amount", label: "Amount (KSh)", type: "number" },
            { key: "frequency", label: "Frequency", type: "select", options: ["One-Time Gift", "Weekly", "Monthly"] },
        ],
        pendingStatus: "new",
    },

    { key: "adminUsers", label: "Admin Users", group: "Settings", icon: "shield", type: "adminUsers", superOnly: true },
];
