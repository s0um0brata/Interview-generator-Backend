const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const interviewReportSchema = z.object({
  matchScore: z.number(),

  technicalQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),

  behavioralQuestions: z.array(
    z.object({
      question: z.string(),
      intention: z.string(),
      answer: z.string(),
    }),
  ),

  skillGaps: z.array(
    z.object({
      skill: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),

  preparationPlan: z.array(
    z.object({
      day: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
    }),
  ),
  title: z.string(),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  try {
    const prompt = `
Generate ONLY valid JSON.

STRICT RULES:
- Do not return markdown
- Do not return explanation
- Do not return \`\`\`json
- Return ONLY JSON
- Follow the exact structure
- ALL fields are required
- title is mandatory

Expected JSON structure:

{
  "title": "Full Stack Developer Interview Preparation Report",

  "matchScore": 90,

  "technicalQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "behavioralQuestions": [
    {
      "question": "string",
      "intention": "string",
      "answer": "string"
    }
  ],

  "skillGaps": [
    {
      "skill": "string",
      "severity": "low"
    }
  ],

  "preparationPlan": [
    {
      "day": 1,
      "focus": "string",
      "tasks": ["task1", "task2"]
    }
  ]
}

TITLE RULES:
- The title should sound professional
- Keep it concise
- Mention the target role when possible
- Do not make the title too long
- Examples:
  - "Frontend Developer Interview Preparation Report"
  - "Blockchain Engineer AI Interview Report"
  - "MERN Stack Developer Interview Analysis"
  - "Backend Engineer Interview Roadmap"

TECHNICAL QUESTIONS RULES:
- Generate at least 6 technical questions
- Questions should match the candidate skills and job description
- Answers should be concise but professional

BEHAVIORAL QUESTIONS RULES:
- Generate at least 5 behavioral questions
- Questions should evaluate communication, teamwork, leadership, and problem-solving

SKILL GAP RULES:
- Generate at least 5 realistic skill gaps
- Severity must ONLY be:
  - "low"
  - "medium"
  - "high"

PREPARATION PLAN RULES:
- Generate a 7 day preparation plan
- Each day should contain:
  - day
  - focus
  - minimum 3 tasks

MATCH SCORE RULES:
- Generate a realistic match score between 50 and 100

Resume:
${JSON.stringify(resume, null, 2)}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      // model: "gemini-2.5-flash",
      contents: prompt,
    });

    console.log("\n================ RAW RESPONSE ================\n");
    console.log(response.text);

    // Clean markdown if Gemini returns ```json
    const cleaned = response.text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedData = JSON.parse(cleaned);

    console.log("\n================ PARSED DATA ================\n");
    console.log(parsedData);

    const validatedData = interviewReportSchema.parse(parsedData);

    console.log("\n================ VALIDATED DATA ================\n");
    console.log(JSON.stringify(validatedData, null, 2));

    return validatedData;
  } catch (error) {
    console.error("Error generating interview report:", error);
  }
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      right: "20mm",
      bottom: "15mm",
      left: "15mm",
    },
  });

  await browser.close();

  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using any library like puppeteer",
      ),
  });

  const prompt = `
You are a world-class senior technical resume writer specializing in resumes for software engineers, MERN developers, blockchain developers, and AI-focused engineers.

Your task is to create a HUMAN-LIKE, highly authentic, premium-quality professional resume in HTML format tailored specifically to the target job description.

IMPORTANT:
The resume MUST NOT feel AI-generated.
Avoid generic AI phrases, buzzwords, robotic wording, or exaggerated corporate language.

The resume should read exactly like a real experienced engineer personally wrote it with strong technical depth and practical project experience.

========================
CANDIDATE INFORMATION
========================

Resume Data:
${resume}

Self Description:
${selfDescription}

Target Job Description:
${jobDescription}

========================
OUTPUT REQUIREMENTS
========================

1. Generate a COMPLETE HTML document.

2. Use only INLINE CSS.

3. Create a PREMIUM MODERN resume layout suitable for:
   - FAANG applications
   - startup applications
   - senior frontend/backend/fullstack roles

4. The resume should feel:
   - human-written
   - technically strong
   - realistic
   - achievement-oriented
   - naturally worded

5. Avoid phrases like:
   - "highly motivated professional"
   - "results-driven individual"
   - "passionate developer"
   - "team player"
   - "hardworking candidate"

6. Instead, write naturally with realistic engineering language.

BAD:
"Worked on scalable applications."

GOOD:
"Built a transaction indexing system capable of handling large Ethereum block datasets with dynamic pagination and IndexedDB caching."

7. Expand technical projects deeply and professionally.

8. Add meaningful engineering details:
   - architecture decisions
   - optimization strategies
   - scalability improvements
   - frontend performance work
   - backend implementation details
   - API integrations
   - state management
   - database handling

9. Make project descriptions sound like REAL production engineering work.

10. Tailor technical skills according to the target role.

11. Create a STRONG realistic professional summary.

12. Prioritize:
   - React
   - Node.js
   - MongoDB
   - Blockchain
   - AI integrations
   - APIs
   - performance optimization
   - scalable frontend architecture

13. Use strong typography and spacing.

14. Use elegant modern colors:
   - dark navy
   - subtle blue accents
   - clean grayscale hierarchy

15. Ensure the design renders beautifully in Puppeteer PDF generation.

16. The resume SHOULD NOT be forced into one page.
Allow natural multi-page layout if content is rich.

17. Use proper page spacing for A4 PDFs.

18. Use semantic sections:
   - Header
   - Summary
   - Technical Skills
   - Experience
   - Projects
   - Education
   - Certifications

19. Improve weak bullet points professionally while remaining believable.

20. Make the candidate appear technically strong without sounding fake.

21. Keep the layout clean and recruiter-friendly.

22. Avoid excessive design decorations.

23. No JavaScript.

24. No markdown.

25. Return ONLY valid JSON.

26. Response format:
{
  "html": "complete html document"
}

The final result should look like a real premium software engineer resume created by an expert technical resume consultant — not AI-generated text.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    // model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    },
  });

  const jsonContent = JSON.parse(response.text);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

  return pdfBuffer;
}

module.exports = { generateInterviewReport, generateResumePdf };
