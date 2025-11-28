import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { imageBase64, model = 'gemini-2.5-flash' } = await request.json()
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      )
    }
    
    // שלח ל-Gemini Vision API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'זהה את כל הטקסט בתמונה זו. החזר רק את הטקסט המזוהה, ללא הסברים או תוספות. שמור על פורמט מקורי (שורות, פסקאות). אם יש תגי HTML כמו <b>, <i>, <h1> וכו\' - שמור אותם.'
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 8192,
          }
        })
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      
      let errorMessage = `Gemini API error: ${response.status}`
      
      // הודעות שגיאה ידידותיות
      if (response.status === 429) {
        errorMessage = 'חרגת ממכסת הבקשות של Gemini. נסה שוב בעוד דקה או שדרג את התוכנית שלך.'
      } else if (response.status === 403) {
        errorMessage = 'ה-API key לא תקף או לא מורשה. בדוק את המפתח ב-.env.local'
      } else if (response.status === 404) {
        errorMessage = 'המודל לא נמצא. נסה מודל אחר (1.5 Flash או 1.5 Pro)'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // חלץ את הטקסט מהתשובה
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!text) {
      return NextResponse.json(
        { error: 'No text detected by Gemini' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      text: text.trim()
    })

  } catch (error) {
    console.error('Gemini OCR error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
