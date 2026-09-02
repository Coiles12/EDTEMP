import re

with open('public/js/groupCalendar.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix mobile navigation block missing
mobile_block = """    const now = new Date();

    // -- Navigation Mobile --
    if (typeof window.edtempMobileActiveDayIndex === 'undefined') {
      window.edtempMobileActiveDayIndex = (now.getDay() + 6) % 7;
    }
    const isMobileActive = (i) => i === window.edtempMobileActiveDayIndex;
"""
js = js.replace('    const now = new Date();', mobile_block)

new_list = """    container.innerHTML = this.groupData.map((member) => {
      const isChecked = this.selectedUserIds.has(member.userId);
      const letter = member.username.charAt(0).toUpperCase();
      return `
        <button class="member-avatar-btn ${isChecked ? 'active' : ''}" data-id="${member.userId}">
          <div class="member-avatar" style="background-color: ${member.color || '#3B82F6'}">${letter}</div>
          <div class="member-name" title="${this.escapeHtml(member.username)}">${this.escapeHtml(member.username)}</div>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.member-avatar-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.id);
        if (this.selectedUserIds.has(uid)) {
          this.selectedUserIds.delete(uid);
          btn.classList.remove('active');
        } else {
          this.selectedUserIds.add(uid);
          btn.classList.add('active');
        }
        this.render();
      });
    });"""

js = re.sub(r'    container\.innerHTML = this\.groupData\.map.*?\}\);\n    \}\);', new_list, js, flags=re.DOTALL)

with open('public/js/groupCalendar.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('patched')
