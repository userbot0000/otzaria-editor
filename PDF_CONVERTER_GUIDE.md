# מדריך: הוספת ספר חדש עם המרת PDF

## סקירה כללית

המערכת מאפשרת להוסיף ספרים חדשים על ידי המרת קובץ PDF לתמונות והעלאתן אוטומטית לגיטהאב.

## דרישות מקדימות

### 1. Python מותקן
- גרסה 3.8 ומעלה
- הורד מ: https://www.python.org/downloads/

### 2. משתני סביבה ב-`.env.local`
```env
GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_repo_name
DATABASE_URL=your_mongodb_connection_string
```

## הפעלת השרת המקומי

### Windows:
```bash
start-converter-server.bat
```

השרת יפעל על: `http://localhost:5000`

## תהליך הוספת ספר

### שלב 1: הפעל את השרת המקומי
1. הפעל את `start-converter-server.bat`
2. וודא שהשרת רץ (תראה הודעה "Server is running")

### שלב 2: פתח את פאנל הניהול
1. היכנס לאתר
2. עבור ל-`/admin`
3. לחץ על טאב "ספרים"
4. לחץ על כפתור "הוסף ספר"

### שלב 3: העלה PDF
1. הזן את שם הספר (בעברית)
2. בחר קובץ PDF
3. לחץ "התחל תהליך"

### שלב 4: המתן לסיום
המערכת תבצע אוטומטית:
1. ✅ המרת PDF לתמונות JPG
2. ✅ יצירת ID באנגלית (hash מהשם העברי)
3. ✅ העלאת תמונות ל-GitHub Releases
4. ✅ שמירת מיפוי (ID ↔ שם עברי) ב-MongoDB
5. ✅ הוספת הספר לרשימת הספרים

## מבנה הקבצים

### שרת Python:
- `scripts/server.py` - שרת Flask מקומי
- `start-converter-server.bat` - הפעלת השרת

### ממשק ניהול:
- `src/app/admin/AdminClient.jsx` - מודאל הוספת ספר

### API Routes:
- `src/app/api/admin/books/add/route.js` - הוספת ספר למערכת

## פתרון בעיות

### השרת לא מתחבר
1. וודא ש-Python מותקן
2. הפעל את `start-converter-server.bat`
3. בדוק שהפורט 5000 פנוי

### שגיאה בהמרה
1. וודא שהקובץ הוא PDF תקין
2. בדוק שיש מספיק מקום בדיסק
3. בדוק את הלוגים בטרמינל של השרת

### שגיאה בהעלאה לגיטהאב
1. וודא ש-`GITHUB_TOKEN` תקין
2. וודא שיש הרשאות write ל-releases
3. בדוק את הלוגים

### שגיאה בשמירה ל-MongoDB
1. וודא ש-`DATABASE_URL` תקין
2. בדוק חיבור למסד הנתונים

## טכנולוגיות

### Backend (Python):
- **Flask** - שרת web
- **PyMuPDF** - המרת PDF לתמונות
- **PyGithub** - העלאה לגיטהאב
- **pymongo** - חיבור ל-MongoDB

### Frontend (Next.js):
- **React** - ממשק משתמש
- **Fetch API** - תקשורת עם השרת המקומי

## זרימת נתונים

```
[דפדפן] → [שרת מקומי:5000] → [המרה] → [GitHub] → [MongoDB] → [Next.js API]
```

1. המשתמש מעלה PDF דרך הדפדפן
2. הדפדפן שולח ל-`localhost:5000`
3. השרת המקומי ממיר ל-תמונות
4. השרת מעלה ל-GitHub Releases
5. השרת שומר מיפוי ב-MongoDB
6. הדפדפן מוסיף את הספר דרך Next.js API

## אבטחה

- השרת רץ רק מקומית (`localhost`)
- אין חשיפה לאינטרנט
- משתמש ב-tokens מוצפנים
- הקבצים נמחקים אחרי העלאה

## ביצועים

- המרה: ~1-2 שניות לעמוד
- העלאה: ~0.5 שניות לתמונה
- ספר של 100 עמודים: ~5-10 דקות

## תחזוקה

### עדכון תלויות Python:
```bash
pip install --upgrade flask flask-cors PyMuPDF Pillow PyGithub pymongo
```

### ניקוי קבצים זמניים:
הקבצים נמחקים אוטומטית אחרי כל תהליך.

## תמיכה

אם יש בעיות, בדוק:
1. לוגים בטרמינל של השרת
2. Console בדפדפן
3. סטטוס ב-`http://localhost:5000/health`
