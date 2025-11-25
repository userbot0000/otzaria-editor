// בדיקת קידוד URL

const bookName = 'חוות דעת'
const encoded = encodeURIComponent(bookName)

console.log('Original:', bookName)
console.log('Encoded once:', encoded)
console.log('Encoded twice:', encodeURIComponent(encoded))
console.log()

console.log('Decoded once:', decodeURIComponent(encoded))
console.log('Decoded from double:', decodeURIComponent(encodeURIComponent(encoded)))
console.log()

// סימולציה של מה שקורה
console.log('=== Simulation ===')
console.log('1. User clicks book in library')
console.log('   router.push(`/book/${encodeURIComponent(bookName)}`)')
console.log('   URL: /book/' + encoded)
console.log()

console.log('2. Next.js receives URL param')
console.log('   params.path =', encoded, '(still encoded)')
console.log()

console.log('3. We decode it')
console.log('   bookPath = decodeURIComponent(params.path)')
console.log('   bookPath =', decodeURIComponent(encoded))
console.log()

console.log('4. We fetch API')
console.log('   fetch(`/api/book/${encodeURIComponent(bookPath)}`)')
console.log('   URL: /api/book/' + encodeURIComponent(decodeURIComponent(encoded)))
console.log()

console.log('5. API receives')
console.log('   params.path =', encodeURIComponent(decodeURIComponent(encoded)), '(encoded)')
console.log('   After Next.js decode:', decodeURIComponent(encodeURIComponent(decodeURIComponent(encoded))))
