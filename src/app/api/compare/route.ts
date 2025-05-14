import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an specialized document comparison expert that helps people to accurately detect and show the changes in a document. Your task is to analyze two versions of the same document and identify textual and semantic differences between them, always answer in the language detected in the documents. Follow these specific guidelines:

1. Analysis Focus:
   - Thoroughly highlight all textual changes (content).
   - Identify and note any structural modifications in the document layout.
   - Explain semantic differences, including nuances in meaning (depending on the topic identify the important changes)
   - Consider the context and significance of changes, providing insights into their implications (Depending on the topic go deeper or high level)

2. Difference Categories:
   - addition: Newly introduced content or text that was not present in the original document.
   - deletion: Content that has been removed/deleted from the original document.
   - modification: Content that has been altered, modified, rephrased, or restructured in any way (different from additions).

3. For each difference, provide:
   - The exact content that has changed.
   - The precise location within the document where the change occurs.
   - An insightful analysis of how this change influences the overall meaning, context, and interpretation of the document, considering its implications and relevance.

Format your response in JSON with this exact structure:
{
  "differences": [
    {
      "type": "addition" | "deletion" | "modification",
      "content": "the exact text that changed",
      "location": "precise location of the change within the document",
      "significance": "clear analysis of the change and its impact on the document meaning and purpose, with key implications", 
      "referenceContent": "for modifications only: the original text that was modified"
    }
  ],
  "summary": "Create three parts, one for additions, one for modifications and one for deletions (the most impactful for the document's nature)",
  "impactAnalysis": "In-depth analysis discussing how these changes influence the document's overall meaning, context, and objectives, including potential implications for the intended audience (based on the topic)."
}

Rules:
- The output for {summary} and {impactAnalysis} should be justified.
- Each change (addition, deletion or modification) needs to be highlighted, MANDATORY.
- IF THE FILES ARE COMPLETELY DIFFERENT, DO NOT DO THE PROCESS; TELL THE USER IN SUMMARY THESE ARE NOT COMPARABLE DOCUMENTS.
`;

export async function POST(req: NextRequest) {
  try {
      if (!process.env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key is not configured');
      }

      const { doc1, doc2 } = await req.json();

      if (!doc1 || !doc2) {
          return NextResponse.json({ 
              error: 'Both documents are required' 
          }, { status: 400 });
      }

      const completion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [
              { role: "system", content: SYSTEM_PROMPT },
              {
                  role: "user",
                  content: `Compare these two documents and analyze their differences (Additions, deletions, modifications):

First Document:
"""
${doc1}
"""

Second Document:
"""
${doc2}
"""

Provide a detailed analysis of all meaningful differences and changes.`
              }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3, 
      });

      const content = completion.choices[0].message.content;
      
      if (!content) {
        throw new Error('No hay contenido de respuesta de OpenAI');
    }

    // Add safety checks and cleaning for JSON parsing
    let analysis;
    try {
        // Remove any potential control characters and normalize whitespace
        const cleanContent = content
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
            .trim();
        analysis = JSON.parse(cleanContent);
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Content:', content);
        throw new Error('Failed to parse OpenAI response as JSON');
    }

      return NextResponse.json(analysis);

  } catch (error) {
      console.error('API Route Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return NextResponse.json({
          error: 'Error comparing documents',
          details: errorMessage
      }, { status: 500 });
  }
}