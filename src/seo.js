// Shared by the app (to update <head> on client-side navigation) and by
// vite.config.js (to prerender a static HTML shell per page plus sitemap.xml),
// so crawlers and link previews see the right metadata without running JS.

export const SITE_URL = "https://ackstpaulsyouths.vercel.app";
export const SITE_NAME = "ACK St Pauls Youths";

export const NAV_LINKS = ["Home", "Ministries", "Sermons", "Recorded Sermons", "Written Sermons", "Gallery", "Events", "Connect", "Give", "Community", "Business Directory", "Requests", "Job Board", "Job Seekers", "Testimonies", "About"];

export const slugify = str => str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Maps a page name to its URL path (e.g. "Home" -> "/home") and back, so every
// page has a real, shareable, bookmarkable, refreshable URL instead of hidden state.
export const PAGE_PATHS = {
    "Recorded Sermons": "/resources/recorded-sermons",
    "Written Sermons": "/resources/written-sermons",
    Gallery: "/resources/gallery",
    "Business Directory": "/opportunities/business-directory",
    Requests: "/opportunities/requests",
    "Job Board": "/opportunities/job-board",
    "Job Seekers": "/opportunities/job-seekers",
};
export const pageToPath = page => page === "Home" ? "/" : PAGE_PATHS[page] || `/${slugify(page)}`;
export const pageUrl = page => `${SITE_URL}${pageToPath(page)}`;

// changefreq/priority feed sitemap.xml; title/description feed <head>.
export const PAGE_SEO = {
    Home: {
        title: "ACK St Pauls Youths | Youth Ministry in Embu, Kenya",
        description: "ACK St Pauls Youths is the youth ministry of ACK St Paul's Cathedral in Embu, Kenya. Join us for worship, youth services, events, sermons, ministries, and community.",
        changefreq: "weekly", priority: "1.0",
    },
    Ministries: {
        title: "Youth Ministries | ACK St Pauls Youths, Embu",
        description: "Explore worship, discipleship, outreach, and service opportunities with ACK St Pauls Youths at ACK St Paul's Cathedral in Embu, Kenya.",
        changefreq: "monthly", priority: "0.8",
    },
    Sermons: {
        title: "Sermons and Youth Teachings | ACK St Pauls Youths",
        description: "Watch sermons, youth teachings, and faith resources from ACK St Paul's Cathedral Youth Ministry in Embu, Kenya.",
        changefreq: "weekly", priority: "0.8",
    },
    "Recorded Sermons": {
        title: "Recorded Sermons | ACK St Pauls Youths, Embu",
        description: "Watch recorded youth services and sermons from ACK St Paul's Cathedral, Embu, on video. Catch up on messages you missed.",
        changefreq: "weekly", priority: "0.8",
    },
    "Written Sermons": {
        title: "Written Sermons | ACK St Pauls Youths, Embu",
        description: "Read written sermons and Bible teachings shared by the youth ministry of ACK St Paul's Cathedral in Embu, Kenya.",
        changefreq: "weekly", priority: "0.7",
    },
    Gallery: {
        title: "Photo Gallery | ACK St Pauls Youths, Embu",
        description: "Photos from youth services, events, outreach, and fellowship at ACK St Paul's Cathedral in Embu, Kenya.",
        changefreq: "weekly", priority: "0.6",
    },
    Events: {
        title: "Youth Events in Embu | ACK St Pauls Youths",
        description: "Find upcoming youth services, worship gatherings, outreach events, and community activities from ACK St Pauls Youths in Embu.",
        changefreq: "weekly", priority: "0.8",
    },
    Connect: {
        title: "Connect With Us | ACK St Pauls Youths, Embu",
        description: "Contact ACK St Pauls Youths at ACK St Paul's Cathedral, Embu, Kenya. Join our youth community, ask a question, or plan a visit.",
        changefreq: "monthly", priority: "0.7",
    },
    Give: {
        title: "Give Online via M-Pesa | ACK St Pauls Youths",
        description: "Support the youth ministry, outreach, and discipleship work of ACK St Pauls Youths in Embu, Kenya. Give securely online with M-Pesa.",
        changefreq: "monthly", priority: "0.7",
    },
    Community: {
        title: "Youth Community Board | ACK St Pauls Youths, Embu",
        description: "Discover the ACK St Pauls Youths community in Embu: local businesses, jobs, requests, and opportunities to connect, serve, and grow in faith.",
        changefreq: "weekly", priority: "0.7",
    },
    "Business Directory": {
        title: "Youth Business Directory in Embu | ACK St Pauls Youths",
        description: "Find and support businesses run by members of ACK St Pauls Youths in Embu, Kenya: retail, food, services, technology, fashion, and more.",
        changefreq: "weekly", priority: "0.7",
    },
    Requests: {
        title: "Community Requests | ACK St Pauls Youths, Embu",
        description: "See what members of the ACK St Pauls Youths community in Embu are looking for, and post a request of your own.",
        changefreq: "weekly", priority: "0.5",
    },
    "Job Board": {
        title: "Jobs in Embu | ACK St Pauls Youths Job Board",
        description: "Browse full-time, part-time, internship, volunteer, and casual job openings shared with the ACK St Pauls Youths community in Embu, Kenya.",
        changefreq: "daily", priority: "0.7",
    },
    "Job Seekers": {
        title: "Job Seekers | ACK St Pauls Youths, Embu",
        description: "Meet young people from ACK St Pauls Youths in Embu who are looking for work, and connect with talent in our community.",
        changefreq: "weekly", priority: "0.5",
    },
    Testimonies: {
        title: "Testimonies | ACK St Pauls Youths",
        description: "Read faith stories and testimonies from the youth community at ACK St Paul's Cathedral in Embu, Kenya.",
        changefreq: "weekly", priority: "0.6",
    },
    About: {
        title: "About ACK St Pauls Youths | Anglican Youth Ministry in Embu",
        description: "Learn about ACK St Pauls Youths, the Anglican Church of Kenya youth ministry at ACK St Paul's Cathedral in Embu, Kenya.",
        changefreq: "monthly", priority: "0.6",
    },
};
