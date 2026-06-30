import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { 
  IssueCategory, 
  IssueSeverity, 
  IssueStatus, 
  UserRole
} from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for base64 image uploads
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
const isGeminiEnabled = geminiApiKey && geminiApiKey !== "MY_GEMINI_API_KEY";

const ai = isGeminiEnabled 
  ? new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    })
  : null;

// Persistent In-Memory Database
const datastore = {
  users: [
    { id: "u-1", name: "Alex Reed", email: "alex@civicpulse.ai", role: UserRole.CITIZEN, points: 145, badges: ["Local Reporter", "Neighborhood Guardian"], credibilityScore: 92 },
    { id: "u-2", name: "Maria Santos", email: "maria@civicpulse.ai", role: UserRole.CITIZEN, points: 55, badges: ["Local Reporter"], credibilityScore: 85 },
    { id: "u-3", name: "David Chen", email: "david@civicpulse.ai", role: UserRole.CITIZEN, points: 210, badges: ["Local Reporter", "Neighborhood Guardian", "Community Hero"], credibilityScore: 98 },
    { id: "u-4", name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", role: UserRole.OFFICER, points: 0, badges: [], credibilityScore: 100 },
    { id: "u-5", name: "Director Sarah Jenkins", email: "sarah.jenkins@metro.gov", role: UserRole.ADMIN, points: 0, badges: [], credibilityScore: 100 }
  ],

  departments: [
    { id: "dept-1", name: "Road Maintenance Dept", code: "ROAD", officerCount: 3 },
    { id: "dept-2", name: "Water and Sanitation Dept", code: "WATER", officerCount: 4 },
    { id: "dept-3", name: "Public Lighting Division", code: "LIGHT", officerCount: 2 },
    { id: "dept-4", name: "Parks & Waste Management", code: "WASTE", officerCount: 5 },
    { id: "dept-5", name: "Traffic and Safety Control", code: "TRAFFIC", officerCount: 3 }
  ],

  officers: [
    { id: "off-1", name: "Officer Marcus Vance", email: "marcus.vance@metro.gov", departmentId: "dept-1", isAvailable: true },
    { id: "off-2", name: "Officer Elena Rostova", email: "elena.r@metro.gov", departmentId: "dept-2", isAvailable: true },
    { id: "off-3", name: "Inspector Kenji Sato", email: "kenji.s@metro.gov", departmentId: "dept-4", isAvailable: false }
  ],

  issues: [
    {
      id: "ticket-101",
      title: "Extremely Deep Pothole on Pine Street Blvd",
      description: "A hazardous pothole has opened up in the middle of the street right opposite Metro Library. It's causing cars to swerve or suffer tyre damage. Needs urgent patching.",
      category: IssueCategory.POTHOLE,
      severity: IssueSeverity.HIGH,
      status: IssueStatus.ASSIGNED,
      latitude: 45.5231,
      longitude: -122.6765,
      address: "1012 SW Pine St, Portland, OR",
      reporterId: "u-1",
      reporterName: "Alex Reed",
      departmentId: "dept-1",
      assignedOfficerId: "off-1",
      assignedOfficerName: "Officer Marcus Vance",
      media: [
        { id: "m-1", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-20T09:30:00Z" }
      ],
      verifications: [
        { id: "v-1", userId: "u-2", userName: "Maria Santos", isConfirmed: true, timestamp: "2026-06-20T11:00:00Z" },
        { id: "v-2", userId: "u-3", userName: "David Chen", isConfirmed: true, timestamp: "2026-06-20T12:15:00Z" }
      ],
      comments: [
        { id: "c-1", userId: "u-4", userName: "Officer Marcus Vance", userRole: UserRole.OFFICER, content: "Slight asphalt mixing delayed, scheduled repairs for tomorrow morning during low traffic.", timestamp: "2026-06-21T14:00:00Z" }
      ],
      trustScore: 94,
      createdAt: "2026-06-20T09:30:00Z",
      updatedAt: "2026-06-21T14:00:00Z"
    },
    {
      id: "ticket-102",
      title: "Major Main Water Pipeline Failure",
      description: "Huge streams of clean water erupting from the sidewalk, flooding the adjacent bicycle lanes and parking bays.",
      category: IssueCategory.WATER_LEAK,
      severity: IssueSeverity.CRITICAL,
      status: IssueStatus.IN_PROGRESS,
      latitude: 45.5189,
      longitude: -122.6812,
      address: "1450 SW Broadway, Portland, OR",
      reporterId: "u-2",
      reporterName: "Maria Santos",
      departmentId: "dept-2",
      assignedOfficerId: "off-2",
      assignedOfficerName: "Officer Elena Rostova",
      media: [
        { id: "m-2", url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-21T07:15:00Z" }
      ],
      verifications: [
        { id: "v-3", userId: "u-1", userName: "Alex Reed", isConfirmed: true, timestamp: "2026-06-21T07:45:00Z" }
      ],
      comments: [],
      trustScore: 89,
      createdAt: "2026-06-21T07:15:00Z",
      updatedAt: "2026-06-21T08:30:00Z"
    },
    {
      id: "ticket-103",
      title: "Uncontrolled Garbage Accumulation near Park Gate",
      description: "A huge pile of household plastic and garbage bags dumped on the green field, blocking pedestrian trails.",
      category: IssueCategory.GARBAGE_ACCUMULATION,
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.REPORTED,
      latitude: 45.5312,
      longitude: -122.6589,
      address: "2201 NE Clackamas St, Portland, OR",
      reporterId: "u-3",
      reporterName: "David Chen",
      departmentId: "dept-4",
      media: [
        { id: "m-3", url: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-22T08:00:00Z" }
      ],
      verifications: [],
      comments: [],
      trustScore: 82,
      createdAt: "2026-06-22T08:00:00Z",
      updatedAt: "2026-06-22T08:00:00Z"
    },
    {
      id: "ticket-104",
      title: "Broken Streetlight on Commercial Ave",
      description: "The entire stretch of street from the crossroad is pitched in complete darkness, raising security concerns.",
      category: IssueCategory.BROKEN_STREETLIGHT,
      severity: IssueSeverity.MEDIUM,
      status: IssueStatus.RESOLVED,
      latitude: 45.5098,
      longitude: -122.6455,
      address: "4110 SE Commercial Ave, Portland, OR",
      reporterId: "u-1",
      reporterName: "Alex Reed",
      departmentId: "dept-3",
      media: [
        { id: "m-4", url: "https://images.unsplash.com/photo-1542382257-201b72a2143a?q=80&w=600&auto=format&fit=crop", type: "image", uploadedAt: "2026-06-19T21:00:00Z" }
      ],
      verifications: [
        { id: "v-4", userId: "u-3", userName: "David Chen", isConfirmed: true, timestamp: "2026-06-19T22:30:00Z" }
      ],
      comments: [],
      trustScore: 96,
      createdAt: "2026-06-19T21:00:00Z",
      updatedAt: "2026-06-21T18:00:00Z",
      resolutionEvidence: {
        imageUrl: "https://images.unsplash.com/photo-1506546332852-6d588372d6b0?q=80&w=600&auto=format&fit=crop",
        notes: "Replaced burnt LED lamp driver and verified optical emission line status with grid patrol.",
        resolvedAt: "2026-06-21T18:00:00Z"
      }
    }
  ],

  notifications: [
    { id: "nt-1", userId: "u-1", title: "Issue Verified", message: "Your reported pothole on Pine Street was verified by 2 community members.", type: "success", timestamp: "2026-06-20T12:15:00Z", isRead: false, issueId: "ticket-101" },
    { id: "nt-2", userId: "u-1", title: "Badge Unlocked!", message: "Congratulations! You have unlocked your 'Neighborhood Guardian' badge.", type: "badge", timestamp: "2026-06-21T11:00:00Z", isRead: false },
    { id: "nt-3", userId: "u-2", title: "Can you verify?", message: "A garbage pile has been reported near NE Clackamas St. Are you nearby to verify?", type: "info", timestamp: "2026-06-22T08:12:00Z", isRead: false, issueId: "ticket-103" }
  ],

  predictions: [
    { id: "pred-1", title: "High-Risk Garbage Hotspot", category: IssueCategory.GARBAGE_ACCUMULATION, latitude: 45.5290, longitude: -122.6510, riskFactor: 0.88, reason: "Consistent overflow and weekend trash aggregation based on past 3 months event logs." },
    { id: "pred-2", title: "Drainage Risk Under heavy rain", category: IssueCategory.DRAINAGE_ISSUE, latitude: 45.5120, longitude: -122.6780, riskFactor: 0.72, reason: "Silt accretion and broken culverts detected in surrounding street drainage channels." },
    { id: "pred-3", title: "Pothole Growth Threat Segment", category: IssueCategory.POTHOLE, latitude: 45.5240, longitude: -122.6930, riskFactor: 0.61, reason: "Elevated vibration signatures and micro-cracks detected by public bus accelerometer telemetry." }
  ],

  auditLogs: [
    { id: "log-1", userId: "u-1", userName: "Alex Reed", userRole: "Citizen", action: "REPORT_ISSUE", details: "Reported deep pothole on SW Pine St", timestamp: "2026-06-20T09:30:00Z" },
    { id: "log-2", userId: "u-4", userName: "Officer Marcus Vance", userRole: "Officer", action: "ASSIGN_TICKET", details: "Assigned ticket-101 to Marcus Vance", timestamp: "2026-06-21T12:00:00Z" }
  ]
};

// Trust Score Calculator
function recalculateTrustScore(issue) {
  const confirms = issue.verifications.filter(v => v.isConfirmed).length;
  const rejections = issue.verifications.filter(v => !v.isConfirmed).length;
  let score = 75; // Base confidence score

  score += confirms * 12;
  score -= rejections * 25;

  // Bound between 10 and 99
  issue.trustScore = Math.max(10, Math.min(99, score));
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Get full system state (filtered optionally)
app.get("/api/issues", (req, res) => {
  res.json(datastore.issues);
});

// Get detailed issue
app.get("/api/issues/:id", (req, res) => {
  const issue = datastore.issues.find(i => i.id === req.params.id);
  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }
  res.json(issue);
});

// Endpoint for duplicate detection
app.post("/api/issues/check-duplicate", (req, res) => {
  const { category, latitude, longitude } = req.body;
  if (!category || !latitude || !longitude) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Quick distance approximation
  const matches = datastore.issues.filter(issue => {
    if (issue.category !== category) return false;
    if (issue.status === IssueStatus.CLOSED || issue.status === IssueStatus.RESOLVED) return false;
    
    const dLat = issue.latitude - latitude;
    const dLon = issue.longitude - longitude;
    const distanceThreshold = 0.005; // ~500m
    return (Math.abs(dLat) < distanceThreshold && Math.abs(dLon) < distanceThreshold);
  });

  if (matches.length > 0) {
    return res.json({ duplicateFound: true, existingIssue: matches[0] });
  }
  res.json({ duplicateFound: false });
});

// AI Reporting Route: Analyze image/description with Gemini
app.post("/api/ai/analyze-issue", async (req, res) => {
  const { base64Image, description, address, latitude, longitude } = req.body;
  
  if (!description && !base64Image) {
    return res.status(400).json({ error: "Provide either a description or an image for analysis." });
  }

  try {
    let aiResponseText = "";

    if (isGeminiEnabled && ai) {
      const systemInstruction = `
You are the MyNeighbourhood AI triage engine. Look at the description and optional image attached of a city repair/infrastructure issue.
Your task is to classify this issue and present metadata in structured JSON format.
The output MUST be raw JSON adhering exactly to this structure (do not wrap in markdown block except if requested, output valid searchable string):
{
  "title": "A short, visual, human-like title of the issue",
  "category": "One of: Pothole, Water Leakage, Broken Streetlight, Garbage Accumulation, Drainage Issue, Damaged Road, Public Infrastructure, Illegal Dumping, Fallen Tree, Traffic Signal Issue",
  "severity": "Low, Medium, High, or Critical",
  "summary": "Actionable, clear detailed summary description for the city workforce.",
  "departmentRecommended": "One of: Road Maintenance Dept, Water and Sanitation Dept, Public Lighting Division, Parks & Waste Management, Traffic and Safety Control"
}

Guidance for severity selection:
- Critical: Causes immediate extreme danger, major flooding, raw sewage, or severe traffic blocks.
- High: Deep pothole, completely dark block, blocked lane, broken traffic signals on major junction.
- Medium: Normal garbage accumulation, single broken streetlight, sidewalk minor cracking.
- Low: Cosmetic park infrastructure paint issues, loose railings.
`;

      let contents = [];
      if (base64Image) {
        contents.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        });
      }
      contents.push({
        text: `Analyze this citizenship concern reported by user:\nAddress or Location: ${address || "Unknown"}\nUser notes: ${description || "None, please inspect photo closely as main evidence."}`
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      aiResponseText = response.text || "";
    } else {
      // Rule-based elegant fallback for preview sandbox when API key is unconfigured
      console.log("No Gemini API key configured. Using intelligent rule-based triage simulator.");
      
      const textForFuzzy = (description || "").toLowerCase();
      let category = IssueCategory.INFRASTRUCTURE_FAILURE;
      let severity = IssueSeverity.MEDIUM;
      let dept = "dept-4"; // Parks & Waste

      if (textForFuzzy.includes("pothole") || textForFuzzy.includes("hole") || textForFuzzy.includes("cracked road")) {
        category = IssueCategory.POTHOLE;
        severity = textForFuzzy.includes("big") || textForFuzzy.includes("deep") || textForFuzzy.includes("tire") ? IssueSeverity.HIGH : IssueSeverity.MEDIUM;
        dept = "dept-1"; // Road Maintenance
      } else if (textForFuzzy.includes("water") || textForFuzzy.includes("leak") || textForFuzzy.includes("burst")) {
        category = IssueCategory.WATER_LEAK;
        severity = textForFuzzy.includes("flood") || textForFuzzy.includes("burst") ? IssueSeverity.CRITICAL : IssueSeverity.HIGH;
        dept = "dept-2"; // Water & Sanitation
      } else if (textForFuzzy.includes("light") || textForFuzzy.includes("dark") || textForFuzzy.includes("lamp")) {
        category = IssueCategory.BROKEN_STREETLIGHT;
        severity = IssueSeverity.MEDIUM;
        dept = "dept-3"; // Public Lighting
      } else if (textForFuzzy.includes("garbage") || textForFuzzy.includes("trash") || textForFuzzy.includes("dump") || textForFuzzy.includes("rubbish")) {
        category = IssueCategory.GARBAGE_ACCUMULATION;
        severity = textForFuzzy.includes("illegal") ? IssueSeverity.HIGH : IssueSeverity.MEDIUM;
        dept = "dept-4"; // Parks & Waste
      } else if (textForFuzzy.includes("drain") || textForFuzzy.includes("clog") || textForFuzzy.includes("flooding")) {
        category = IssueCategory.DRAINAGE_ISSUE;
        severity = IssueSeverity.HIGH;
        dept = "dept-2"; // Water & Sanitation
      } else if (textForFuzzy.includes("tree") || textForFuzzy.includes("fall") || textForFuzzy.includes("branch")) {
        category = IssueCategory.FALLEN_TREE;
        severity = IssueSeverity.HIGH;
        dept = "dept-4"; // Parks & Waste
      } else if (textForFuzzy.includes("light") && (textForFuzzy.includes("traffic") || textForFuzzy.includes("signal"))) {
        category = IssueCategory.TRAFFIC_SIGNAL;
        severity = IssueSeverity.CRITICAL;
        dept = "dept-5"; // Traffic Control
      }

      const cleanTitle = `Reported ${category} at ${address?.split(",")[0] || "Local Street"}`;
      const mockResult = {
        title: cleanTitle,
        category,
        severity,
        summary: description || `Simulated triage of reported ${category.toLowerCase()} causing civic discomfort. Verification required in due course.`,
        departmentRecommended: datastore.departments.find(d => d.id === dept)?.name || "Road Maintenance Dept"
      };

      aiResponseText = JSON.stringify(mockResult);
    }

    res.json(JSON.parse(aiResponseText));
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze reported issue via AI." });
  }
});

// File report endpoint (Citizen submits issue)
app.post("/api/issues/create", (req, res) => {
  const { title, description, category, severity, address, latitude, longitude, reporterId, mediaUrl, isAnonymous } = req.body;

  if (!title || !category || !reporterId) {
    return res.status(400).json({ error: "Missing required report elements." });
  }

  // Find reporter
  const reporter = datastore.users.find(u => u.id === reporterId);
  if (!reporter) {
    return res.status(404).json({ error: "Reporter not found" });
  }

  // Determine Department
  let departmentId = "dept-1";
  if (category === IssueCategory.WATER_LEAK || category === IssueCategory.DRAINAGE_ISSUE) {
    departmentId = "dept-2";
  } else if (category === IssueCategory.BROKEN_STREETLIGHT) {
    departmentId = "dept-3";
  } else if (category === IssueCategory.GARBAGE_ACCUMULATION || category === IssueCategory.ILLEGAL_DUMPING || category === IssueCategory.FALLEN_TREE) {
    departmentId = "dept-4";
  } else if (category === IssueCategory.TRAFFIC_SIGNAL) {
    departmentId = "dept-5";
  }

  const newTicketId = `ticket-${Date.now().toString().slice(-4)}`;
  const newIssue = {
    id: newTicketId,
    title,
    description,
    category: category,
    severity: severity || IssueSeverity.MEDIUM,
    status: IssueStatus.REPORTED,
    latitude: latitude || 45.5200,
    longitude: longitude || -122.6800,
    address: address || "City Center",
    reporterId,
    reporterName: isAnonymous ? "Anonymous Citizen" : reporter.name,
    departmentId,
    media: mediaUrl ? [{ id: `med-${Date.now()}`, url: mediaUrl, type: "image", uploadedAt: new Date().toISOString() }] : [],
    verifications: [],
    comments: [],
    trustScore: reporter.credibilityScore > 90 ? 80 : 70,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  datastore.issues.unshift(newIssue);

  // Award Points
  reporter.points += 10;
  
  // Audit log
  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId: reporterId,
    userName: reporter.name,
    userRole: "Citizen",
    action: "REPORT_ISSUE",
    details: `Created issue ${newTicketId}: ${title}`,
    timestamp: new Date().toISOString()
  });

  // Evaluate badges
  evaluateUserBadges(reporter);

  // Notify surrounding officers or simulate a push to community
  datastore.notifications.unshift({
    id: `not-${Date.now()}`,
    userId: "u-1", // Inform Alex or David
    title: "New Local Report Filed",
    message: `A new ${category.toLowerCase()} has been reported nearby at ${newIssue.address}. Check mapping coordinates to verify!`,
    type: "info",
    timestamp: new Date().toISOString(),
    isRead: false,
    issueId: newTicketId
  });

  res.status(201).json({ success: true, issue: newIssue, pointsAwarded: 10 });
});

// Community verify issue
app.post("/api/issues/:id/verify", (req, res) => {
  const { userId, isConfirmed, proofUrl } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Check if they already verified
  const alreadyVerifiedIndex = issue.verifications.findIndex(v => v.userId === userId);
  if (alreadyVerifiedIndex !== -1) {
    issue.verifications[alreadyVerifiedIndex] = {
      id: issue.verifications[alreadyVerifiedIndex].id,
      userId,
      userName: user.name,
      isConfirmed,
      uploadedProofUrl: proofUrl || issue.verifications[alreadyVerifiedIndex].uploadedProofUrl,
      timestamp: new Date().toISOString()
    };
  } else {
    issue.verifications.push({
      id: `v-${Date.now()}`,
      userId,
      userName: user.name,
      isConfirmed,
      uploadedProofUrl: proofUrl,
      timestamp: new Date().toISOString()
    });
    
    // Award 5 XP points
    user.points += 5;
    evaluateUserBadges(user);
  }

  // Recalculate Trust Score
  recalculateTrustScore(issue);

  // Auto transition to VERIFIED if trust score exceeds 85%
  if (issue.trustScore >= 85 && issue.status === IssueStatus.REPORTED) {
    issue.status = IssueStatus.VERIFIED;
    
    // Notify reporter
    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.reporterId,
      title: "Issue Verified!",
      message: `Your report "${issue.title}" has reached verified status thanks to community backup. Sent to authorities.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  issue.updatedAt = new Date().toISOString();

  // Audit
  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "VERIFY_ISSUE",
    details: `${isConfirmed ? "Confirmed" : "Rejected"} issue status for ${issue.id}. New trust score is ${issue.trustScore}%`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
});

// Officer/Admin Workflow: Update Lifecycle Status
app.post("/api/issues/:id/status", (req, res) => {
  const { userId, status, notes, assignedOfficerId, resolutionEvidenceUrl } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Access Control check
  if (user.role !== UserRole.OFFICER && user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Only authorized personnel can update transition status." });
  }

  const oldStatus = issue.status;
  issue.status = status;
  issue.updatedAt = new Date().toISOString();

  if (assignedOfficerId) {
    const officer = datastore.officers.find(o => o.id === assignedOfficerId);
    if (officer) {
      issue.assignedOfficerId = officer.id;
      issue.assignedOfficerName = officer.name;
    }
  }

  // Capture resolution details if resolved
  if (status === IssueStatus.RESOLVED) {
    issue.resolutionEvidence = {
      imageUrl: resolutionEvidenceUrl || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop",
      notes: notes || "Resolved by Municipal Action Team. Field service report filed successfully.",
      resolvedAt: new Date().toISOString()
    };

    // Notify reporter immediately
    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.reporterId,
      title: "Issue Resolved!",
      message: `The municipal team has resolved your report "${issue.title}". Please verify the resolution if happy.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  // Audit
  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "UPDATE_STATUS",
    details: `Transitioned issue ${issue.id} from ${oldStatus} to ${status}. Notes: ${notes || "None"}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
});

// Citizen feedback on Resolution: Approve or Reject
app.post("/api/issues/:id/citizen-feedback", (req, res) => {
  const { userId, approved, rejectionNotes } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (issue.reporterId !== userId) {
    return res.status(403).json({ error: "Only the original reporter can confirm or reopen the resolution." });
  }

  const reporter = datastore.users.find(u => u.id === userId);

  if (approved) {
    issue.status = IssueStatus.CLOSED;
    
    // Award the citizen extra points for validation confirmation
    if (reporter) {
      reporter.points += 5;
      evaluateUserBadges(reporter);
    }

    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId,
      title: "Ticket Closed Successfully",
      message: `Thank you! Your feedback closed ticket "${issue.title}". You earned +5 community engagement points.`,
      type: "success",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  } else {
    // Reopen ticket
    issue.status = IssueStatus.IN_PROGRESS;
    issue.comments.push({
      id: `c-${Date.now()}`,
      userId,
      userName: reporter?.name || "Reporter",
      userRole: UserRole.CITIZEN,
      content: `⚠️ Resolution Rejected by Reporter. Reason: ${rejectionNotes || "Work incomplete."}`,
      timestamp: new Date().toISOString()
    });

    datastore.notifications.unshift({
      id: `not-${Date.now()}`,
      userId: issue.assignedOfficerId || "u-4",
      title: "Resolution Rejected - Ticket Reopened",
      message: `Reporter Alex Reed rejected the patch on "${issue.title}". Ticket returned to In Progress queue.`,
      type: "warning",
      timestamp: new Date().toISOString(),
      isRead: false,
      issueId: issue.id
    });
  }

  issue.updatedAt = new Date().toISOString();

  // Audit
  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: reporter?.name || "Reporter",
    userRole: "Citizen",
    action: approved ? "CLOSE_TICKET" : "REOPEN_TICKET",
    details: approved ? `Citizen approved resolution on ${issue.id}` : `Citizen rejected resolution on ${issue.id}. Reason: ${rejectionNotes}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, issue });
});

// Post a comment
app.post("/api/issues/:id/comments", (req, res) => {
  const { userId, content } = req.body;
  const issue = datastore.issues.find(i => i.id === req.params.id);

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const user = datastore.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const newComment = {
    id: `comment-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    content,
    timestamp: new Date().toISOString()
  };

  issue.comments.push(newComment);
  issue.updatedAt = new Date().toISOString();

  // Audit
  datastore.auditLogs.unshift({
    id: `audit-${Date.now()}`,
    userId,
    userName: user.name,
    userRole: user.role,
    action: "ADD_COMMENT",
    details: `Added progress comment to ticket ${issue.id}`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, comment: newComment, issue });
});

// Gamification stats, leaderboard & current progress
app.get("/api/users/:id/dashboard", (req, res) => {
  const user = datastore.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userIssues = datastore.issues.filter(i => i.reporterId === user.id);
  const userVerifications = datastore.issues.filter(i => i.verifications.some(v => v.userId === user.id));

  // Compute leaderboard sorted by points
  const leaderboard = datastore.users
    .filter(u => u.role === UserRole.CITIZEN)
    .map(u => ({
      userId: u.id,
      name: u.name,
      points: u.points,
      badgesCount: u.badges.length,
      resolvedCount: datastore.issues.filter(i => i.reporterId === u.id && i.status === IssueStatus.CLOSED).length
    }))
    .sort((a, b) => b.points - a.points);

  res.json({
    user,
    userIssuesCount: userIssues.length,
    userVerificationsCount: userVerifications.length,
    resolvedCount: userIssues.filter(i => i.status === IssueStatus.CLOSED).length,
    leaderboard
  });
});

// Manage notifications read state
app.post("/api/notifications/:id/read", (req, res) => {
  const notif = datastore.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Notification not found" });
});

app.get("/api/notifications/user/:userId", (req, res) => {
  const notifs = datastore.notifications.filter(n => n.userId === req.params.userId || n.userId === "all");
  res.json(notifs);
});

// Predictive Hotspots list
app.get("/api/predictions/hotspots", (req, res) => {
  res.json(datastore.predictions);
});

// Admin dashboard summary statistics
app.get("/api/admin/stats", (req, res) => {
  const totalIssues = datastore.issues.length;
  const closedOrResolved = datastore.issues.filter(i => i.status === IssueStatus.CLOSED || i.status === IssueStatus.RESOLVED).length;
  const resolutionRate = totalIssues > 0 ? Math.round((closedOrResolved / totalIssues) * 100) : 0;

  // Breakdown by department
  const deptPerformance = datastore.departments.map(dept => {
    const deptIssues = datastore.issues.filter(i => i.departmentId === dept.id);
    const resolved = deptIssues.filter(i => i.status === IssueStatus.CLOSED || i.status === IssueStatus.RESOLVED).length;
    return {
      department: dept.name,
      code: dept.code,
      total: deptIssues.length,
      resolved,
      efficiency: deptIssues.length > 0 ? Math.round((resolved / deptIssues.length) * 100) : 100
    };
  });

  // Category distribution
  const categoryCount = datastore.issues.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const categoryDistribution = Object.keys(categoryCount).map(key => ({
    category: key,
    count: categoryCount[key]
  }));

  res.json({
    totalUsers: datastore.users.length,
    totalIssues,
    resolvedIssuesCount: closedOrResolved,
    unresolvedIssuesCount: totalIssues - closedOrResolved,
    overallResolutionRate: resolutionRate,
    deptPerformance,
    categoryDistribution,
    auditLogs: datastore.auditLogs.slice(0, 15)
  });
});

// AI Civic Chatbot Route: Handles rich system-wide contextual Q&A
app.post("/api/ai/chat", async (req, res) => {
  const { messages, userId } = req.body;
  if (!messages || messages.length === 0) {
    return res.status(400).json({ error: "Missing conversation message logs." });
  }

  try {
    const user = datastore.users.find(u => u.id === (userId || "u-1"));
    const issuesListStr = datastore.issues.map(iss => {
      const verificationsCount = iss.verifications.length;
      return `Ticket ID: "${iss.id}", Title: "${iss.title}", Category: "${iss.category}", Severity: "${iss.severity}", Status: "${iss.status}", Address: "${iss.address}", Assigned Officer: "${iss.assignedOfficerName || "None"}", Trust Score: "${iss.trustScore}%", VerificationsCount: ${verificationsCount}, Created at: "${iss.createdAt}".`;
    }).join("\n");

    const predictionsStr = datastore.predictions.map(pred => {
      return `Prediction Area: "${pred.title}", Category: "${pred.category}", Risk Factor: "${Math.round(pred.riskFactor * 100)}%", Reason: "${pred.reason}".`;
    }).join("\n");

    const systemInstruction = `
You are the MyNeighbourhood AI Community Assistant, a highly intelligent and friendly chatbot dedicated to enhancing citizen-municipal trust and transparency.
Your tone should be objective, encouraging, and informative, avoiding technical jargon where possible, yet highly accountable.

Below is the live operational data from the City Portal:
=== UNRESOLVED & ACTIVE ISSUES ===
${issuesListStr}

=== AI PREDICTIVE HOTSPOTS ===
${predictionsStr}

=== MUNICIPAL DEPARTMENTS ===
- Road Maintenance Dept: Handles pot holes, road wear, broken sidewalks.
- Water and Sanitation Dept: Handles clean water leakages, main line bursts, clogged storm drains, raw sewer overflows.
- Public Lighting Division: Handles blacked-out lamp posts, solar bulb failures, grid wiring faults.
- Parks & Waste Management: Handles rubbish overflow, leaf debris, illegal dumping sites, and fallen trees.
- Traffic and Safety Control: Handles traffic delays, failing crossing signals, and road closures.

Current Active Citizen User logged in: ${user?.name || "Guest Citizen"} (XP Points: ${user?.points || 0}, Badges: ${user?.badges?.join(", ") || "None"}).

Helpful constraints:
- Speak directly about specific tickets by name if they ask for their status.
- If they ask "What's the status of my complaint?", query the issues lists for Alex Reed or Maria Santos depending on user, or show open items likeSW Broadway Water Leakage (ticket-102) or Pine Street Blvd Pothole (ticket-101).
- If they ask "Why is this delayed?", highlight that municipal logistics such as asphalt mixers (e.g. on Pine St) or pipe supplies might be currently assigned and scheduled, or explain based on the status (In Progress, Assigned).
- Do NOT make up tickets that are not listed above, but feel free to suggest they can submit a new ticket directly via the reporting dashboard at any time.
- Keep answers formatted in highly clean markdown with clear spacing. Bold key terms.
`;

    if (isGeminiEnabled && ai) {
      // Map user/agent message array to Gemini contents SDK structure
      const contents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const reply = response.text || "I was unable to extract a text response from MyNeighbourhood AI services. Please try again shortly.";
      res.json({ content: reply });
    } else {
      // Rule-based conversational simulator fallback
      const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
      let replyText = "";

      if (lastUserMsg.includes("status") || lastUserMsg.includes("complaint") || lastUserMsg.includes("my ticket")) {
        replyText = `Hello! Currently, there are **3 active issues** in your neighborhood:
1. **SW Pine Street Pothole (ticket-101)**: Status is **Assigned** to Officer Marcus Vance. Repairs are scheduled for tomorrow morning during low-intensity traffic cycles.
2. **SW Broadway Water Leakage (ticket-102)**: Status is **In Progress**. Officer Elena Rostova is actively sealing the main conduit right now.
3. **NE Clackamas St Garbage Overflow (ticket-103)**: Status is **Reported**. It is awaiting further community confirmation to boost its trust score!

Which one of these would you like to track in detail?`;
      } else if (lastUserMsg.includes("delay") || lastUserMsg.includes("why is it take")) {
        replyText = `Under stood. Some issues like the **SW Pine Street Pothole** have experienced minor delays because the Road Maintenance Team had to synchronize asphalt mixing with low-vibration transit slots. Scheduling is set for tomorrow morning to minimize disruption. We appreciate your community-focused patience!`;
      } else if (lastUserMsg.includes("department") || lastUserMsg.includes("who handles")) {
        replyText = `Our municipality routes tickets to **5 specialized subdivisions**:
- **Road Maintenance**: Potholes and asphalt surface layers.
- **Water & Sanitation**: Water pipes, leaks, and drainage.
- **Public Lighting**: Dark corridors and broken lamp bulbs.
- **Parks & Waste**: Garbage collection, dumping, and fallen branches.
- **Traffic Safety**: Signals, indicators, and safety boards.

Our AI triage automatically recommends the optimal department when you upload your photo!`;
      } else if (lastUserMsg.includes("near me") || lastUserMsg.includes("unresolved")) {
        replyText = `I found **3 unresolved issues** near your current coordinates:
- 🚨 **Water Leakage** | SW Broadway (Critical, 140m away) - In Progress
- ⚠️ **Pothole** | SW Pine St (High, 320m away) - Assigned
- 🗑️ **Garbage Accumulation** | NE Clackamas St (Medium, 1.2km away) - Reported

You can access the interactive **Civic Map** to verify these or add photo proof to increase their Trust Scores!`;
      } else {
        replyText = `Hello! I am your **MyNeighbourhood AI Assistant**. I bridge communications between you and municipal managers.

You can ask me questions like:
- *"What is status of SW Pine Street pothole?"*
- *"Show unresolved issues near me"*
- *"Why are repairs on Pine St delayed?"*
- *"Who handles sewer leakage in the park?"*
- *"How can I earn badges?"*

How can I boost your community efforts today?`;
      }

      res.json({ content: replyText });
    }
  } catch (error) {
    console.error("Chat assist error:", error);
    res.status(500).json({ error: error.message || "Conversational bridge unavailable." });
  }
});

// Helper: Evaluates badges earned by point milestones
function evaluateUserBadges(user) {
  const currentBadges = [...user.badges];
  
  if (user.points >= 30 && !currentBadges.includes("Local Reporter")) {
    currentBadges.push("Local Reporter");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b1`,
      userId: user.id,
      title: "Badge Unlocked: Local Reporter!",
      message: "You've earned the 'Local Reporter' badge for your active alert inputs.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }
  
  if (user.points >= 80 && !currentBadges.includes("Neighborhood Guardian")) {
    currentBadges.push("Neighborhood Guardian");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b2`,
      userId: user.id,
      title: "Badge Unlocked: Neighborhood Guardian!",
      message: "You've earned the 'Neighborhood Guardian' badge for confirming civic facts.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }

  if (user.points >= 150 && !currentBadges.includes("Community Hero")) {
    currentBadges.push("Community Hero");
    datastore.notifications.unshift({
      id: `not-${Date.now()}-b3`,
      userId: user.id,
      title: "Badge Unlocked: Community Hero!",
      message: "Incredible commitment! You are now recognized as an official Community Hero.",
      type: "badge",
      timestamp: new Date().toISOString(),
      isRead: false
    });
  }

  user.badges = currentBadges;
}

// ----------------------------------------------------
// NODE SERVING (Vite + Dist Static Files)
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Mount Vite's HMR middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: Serve static files from compiled dist/
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MyNeighbourhood] Full-stack Server successfully initialized.`);
    console.log(`Port binding: Host 0.0.0.0 on port ${PORT}`);
    console.log(`Live developer environment ready.`);
  });
}

startServer();
