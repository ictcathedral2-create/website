import { useRef, useState } from "react";
import { useFirebaseCollection } from "../hooks/useFirebaseCollection";
import { buildRecipients, formatPhone, renderMessage, smsParts, MAX_SMS_PARTS } from "../utils/sms";
import { callSendSms } from "./smsApi";
import { Icon, Notice, PageHeader, StatusPill, formatWhen, useToast } from "./ui";

const STARTER = "Hi {firstName}, ";

export default function SendSms({ open }) {
    const registrations = useFirebaseCollection("submissions/joinUsRegistrations");
    const members = useFirebaseCollection("smsMembers");
    const optOutList = useFirebaseCollection("smsOptOuts");
    const campaigns = useFirebaseCollection("smsCampaigns");
    const { notify, run } = useToast();
    const textRef = useRef(null);
    const stopRef = useRef(false);

    const [message, setMessage] = useState(STARTER);
    const [testPhone, setTestPhone] = useState("");
    const [testing, setTesting] = useState(false);
    const [progress, setProgress] = useState(null);
    const [showInvalid, setShowInvalid] = useState(false);

    const loading = registrations.loading || members.loading || optOutList.loading;
    const loadError = registrations.error || members.error || optOutList.error;
    const optOuts = Object.fromEntries((optOutList.data || []).map(o => [o.id, true]));
    const { recipients, invalid, duplicates, optedOut } = buildRecipients(registrations.data || [], members.data || [], optOuts);
    const fromSignups = recipients.filter(r => r.source === "signup").length;

    // Size the estimate on the longest personalised copy.
    const longest = recipients.reduce((max, r) => Math.max(max, renderMessage(message, r).length), 0);
    const sample = recipients.find(r => renderMessage(message, r).length === longest);
    const { length, parts, unicode } = smsParts(sample ? renderMessage(message, sample) : message);
    const totalSms = parts * recipients.length;
    const tooLong = parts > MAX_SMS_PARTS;
    const sending = progress && !progress.finished;

    const insert = token => {
        const el = textRef.current;
        const start = el?.selectionStart ?? message.length;
        const end = el?.selectionEnd ?? message.length;
        setMessage(message.slice(0, start) + token + message.slice(end));
        requestAnimationFrame(() => {
            el?.focus();
            el?.setSelectionRange(start + token.length, start + token.length);
        });
    };

    const sendTest = async () => {
        setTesting(true);
        await run(() => callSendSms({ action: "test", message, phone: testPhone }), "Test sent to your phone's queue");
        setTesting(false);
    };

    const sendAll = async () => {
        if (!window.confirm(`Send this message to ${recipients.length} members?\n\nThat's about ${totalSms} SMS from the gateway phone's bundle. This can't be undone.`)) return;
        stopRef.current = false;
        setProgress({ total: recipients.length, done: 0, sent: 0, failed: 0, finished: false });
        try {
            const { campaignId, total } = await callSendSms({ action: "start", message });
            let offset = 0, sent = 0, failed = 0, lastError = null;
            setProgress({ total, done: 0, sent, failed, finished: false });
            while (offset < total) {
                if (stopRef.current) {
                    await callSendSms({ action: "stop", campaignId });
                    break;
                }
                const batch = await callSendSms({ action: "batch", campaignId, offset });
                sent += batch.sent;
                failed += batch.failed;
                lastError = batch.lastError || lastError;
                offset = batch.nextOffset;
                setProgress({ total, done: offset, sent, failed, finished: false });
                if (batch.done) break;
            }
            setProgress({ total, done: offset, sent, failed, finished: true, stopped: stopRef.current, lastError });
            notify(stopRef.current ? `Stopped. ${sent} queued before stopping.` : `Done: ${sent} queued${failed ? `, ${failed} failed` : ""}.`, failed && !sent ? "error" : "ok");
        } catch (err) {
            setProgress(p => ({ ...p, finished: true, lastError: err.message }));
            notify(err.message || "Sending failed.", "error");
        }
    };

    const history = (campaigns.data || []).slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return (
        <div>
            <PageHeader eyebrow="People" title="Send SMS" subtitle="Write one message and every member receives their own copy with their name, sent from the church's SMS phone.">
                <button className="adm-btn" onClick={() => open("smsMembers")}><Icon name="users" size={15} /> Manage members</button>
            </PageHeader>

            {loading && <div className="adm-loading">Loading members…</div>}
            {!loading && loadError && <Notice tone="error">Couldn't load the member list. Check that the database rules allow admins to read smsMembers and smsOptOuts (see docs/sms-setup.md).</Notice>}

            {!loading && !loadError && (
                <div className="adm-two-col">
                    <div className="adm-card adm-panel">
                        <h3>Message</h3>
                        <div className="adm-actions" style={{ marginBottom: "0.6rem" }}>
                            <button className="adm-btn sm" onClick={() => insert("{firstName}")}><Icon name="plus" size={13} /> First name</button>
                            <button className="adm-btn sm" onClick={() => insert("{name}")}><Icon name="plus" size={13} /> Full name</button>
                        </div>
                        <textarea
                            ref={textRef}
                            className="form-textarea"
                            style={{ minHeight: 170 }}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Hi {firstName}, join us this Sunday at 2 PM for the Youth Service…"
                            aria-label="Message"
                            disabled={sending}
                        />
                        <div className="adm-hint" style={tooLong ? { color: "#9B2C1A" } : undefined}>
                            {length} characters · {parts} SMS each{unicode ? " (contains emoji or special characters, so fewer characters fit per SMS)" : ""}
                            {tooLong && ` · too long, the limit is ${MAX_SMS_PARTS} SMS`}
                        </div>

                        <h3 style={{ marginTop: "1.4rem" }}>Preview</h3>
                        {recipients.length === 0 && <div className="adm-hint">No members yet.</div>}
                        {recipients.slice(0, 3).map(r => (
                            <div key={r.phone} className="adm-row">
                                <div className="adm-row-main">
                                    <div className="adm-row-sub">To {`${r.firstName} ${r.lastName}`.trim() || "member"} · {formatPhone(r.phone)}</div>
                                    <div className="adm-longtext" style={{ fontSize: "0.88rem", marginTop: 4 }}>{renderMessage(message, r)}</div>
                                </div>
                            </div>
                        ))}

                        <h3 style={{ marginTop: "1.4rem" }}>Send a test first</h3>
                        <div className="adm-toolbar" style={{ marginBottom: 0 }}>
                            <div className="adm-search">
                                <Icon name="phone" size={16} />
                                <input type="tel" placeholder="Your number, e.g. 0712 345 678" value={testPhone} onChange={e => setTestPhone(e.target.value)} aria-label="Test phone number" />
                            </div>
                            <button className="adm-btn" disabled={testing || sending || !testPhone.trim() || !message.trim() || tooLong} onClick={sendTest}>
                                <Icon name="send" size={14} /> {testing ? "Sending…" : "Send test"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="adm-card adm-panel" style={{ marginBottom: "1.25rem" }}>
                            <h3>Recipients</h3>
                            <div className="adm-stat-num">{recipients.length}</div>
                            <div className="adm-stat-note" style={{ marginTop: 6, lineHeight: 1.6 }}>
                                {fromSignups} from Membership Sign-ups, {recipients.length - fromSignups} added by you
                                {duplicates > 0 && <><br />{duplicates} duplicate number{duplicates === 1 ? "" : "s"} sent only once</>}
                                {optedOut > 0 && <><br />{optedOut} opted out, not sent</>}
                                {invalid.length > 0 && <><br /><button className="adm-more" style={{ marginLeft: 0 }} onClick={() => setShowInvalid(!showInvalid)}>{invalid.length} invalid number{invalid.length === 1 ? "" : "s"} skipped</button></>}
                            </div>
                            {showInvalid && (
                                <ul className="adm-hint" style={{ paddingLeft: "1.1rem" }}>
                                    {invalid.map((p, i) => <li key={i}>{p.name}: “{p.phone || "no number"}” ({p.source === "signup" ? "sign-up" : "added"})</li>)}
                                </ul>
                            )}
                            <div className="adm-stat-note" style={{ marginTop: "0.9rem" }}>About <strong>{totalSms}</strong> SMS will be used from the phone's bundle.</div>

                            {progress && (
                                <div style={{ marginTop: "1rem" }}>
                                    <div style={{ height: 8, borderRadius: 999, background: "var(--adm-line)", overflow: "hidden" }}>
                                        <div style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`, height: "100%", background: "var(--gold)", transition: "width 0.3s" }} />
                                    </div>
                                    <div className="adm-hint">
                                        {progress.done} of {progress.total} processed · {progress.sent} queued{progress.failed ? ` · ${progress.failed} failed` : ""}
                                        {progress.finished && !progress.stopped && " · finished"}
                                        {progress.stopped && " · stopped"}
                                    </div>
                                    {progress.lastError && <Notice tone="error">{progress.lastError}</Notice>}
                                </div>
                            )}

                            <div className="adm-actions" style={{ marginTop: "1rem" }}>
                                {sending ? (
                                    <button className="adm-btn danger" onClick={() => { stopRef.current = true; }}><Icon name="close" size={14} /> Stop sending</button>
                                ) : (
                                    <button className="adm-btn gold" disabled={!recipients.length || !message.trim() || tooLong} onClick={sendAll}>
                                        <Icon name="send" size={14} /> Send to all {recipients.length}
                                    </button>
                                )}
                            </div>
                            <div className="adm-hint" style={{ marginTop: "0.7rem" }}>
                                Messages are queued on the SMS phone, which then sends them one by one. Keep it switched on, charged and online until they're all out.
                            </div>
                        </div>

                        <div className="adm-card adm-panel">
                            <h3>History</h3>
                            {history.length === 0 && <div className="adm-hint">Nothing sent yet.</div>}
                            {history.slice(0, 15).map(c => (
                                <div key={c.id} className="adm-row">
                                    <div className="adm-row-main">
                                        <div className="adm-row-title">{c.message}</div>
                                        <div className="adm-row-sub">{formatWhen(c.createdAt)} · {c.sent || 0} of {c.total || 0} queued{c.failed ? `, ${c.failed} failed` : ""}</div>
                                    </div>
                                    <StatusPill status={c.status} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
