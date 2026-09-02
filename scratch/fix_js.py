import re

def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    replacement = """
    // -- Navigation Mobile --
    if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
      window.edtempMobileActiveDayIndex = (now.getDay() + 6) % 7; // Lundi=0, Dimanche=6
    }
"""
    broken_block = r"""    // -- Navigation Mobile --
    if \(typeof window\.edtempMobileActiveDayIndex === 'undefined'\) \{
      window\.edtempMobileActiveDayIndex = weekDays\.findIndex\(d => d\.toDateString\(\) === now\.toDateString\(\)\);
      if \(window\.edtempMobileActiveDayIndex === -1\) window\.edtempMobileActiveDayIndex = 0;
    \}"""
    
    content = re.sub(broken_block, replacement, content)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('public/js/calendar.js')
fix_file('public/js/groupCalendar.js')
print("Fixed reference error.")
