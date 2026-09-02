import re

with open('public/js/groupCalendar.js', 'r', encoding='utf-8') as f:
    grp_js = f.read()

# Replace the groupMembersList generation
old_html = r'''      container\.innerHTML = this\.groupData\.map\(\(member\) => \{
        const isChecked = this\.selectedUserIds\.has\(member\.userId\);
        return `
          <label class="member-checkbox-item" data-id="\$\{member\.userId\}">
            <input type="checkbox" value="\$\{member\.userId\}" \$\{isChecked \? 'checked' : ''\} />
            <span class="member-color-indicator" style="background-color: \$\{member\.color \|\| '#3B82F6'\}"></span>
            <span class="member-name" title="\$\{this\.escapeHtml\(member\.username\)\}">\$\{this\.escapeHtml\(member\.username\)\}</span>
          </label>
        `;
      \}\)\.join\(''\);'''

new_html = r'''      container.innerHTML = this.groupData.map((member) => {
        const isChecked = this.selectedUserIds.has(member.userId);
        const letter = member.username.charAt(0).toUpperCase();
        return `
          <button class="member-avatar-btn ${isChecked ? 'active' : ''}" data-id="${member.userId}">
            <div class="member-avatar" style="background-color: ${member.color || '#3B82F6'}">${letter}</div>
            <div class="member-name" title="${this.escapeHtml(member.username)}">${this.escapeHtml(member.username)}</div>
          </button>
        `;
      }).join('');'''

grp_js = re.sub(old_html, new_html, grp_js)

old_listeners = r'''      container\.querySelectorAll\('input\[type="checkbox"\]'\)\.forEach\(\(chk\) => \{
        chk\.addEventListener\('change', \(e\) => \{
          const uid = Number\(e\.target\.value\);
          if \(e\.target\.checked\) \{
            this\.selectedUserIds\.add\(uid\);
          \} else \{
            this\.selectedUserIds\.delete\(uid\);
          \}
          this\.render\(\);
        \}\);
      \}\);'''

new_listeners = r'''      container.querySelectorAll('.member-avatar-btn').forEach((btn) => {
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
      });'''

grp_js = re.sub(old_listeners, new_listeners, grp_js)

# Replace the manual checkbox update in selectAll/deselectAll
old_chk_update = r'''    container\.querySelectorAll\('input\[type="checkbox"\]'\)\.forEach\(\(chk\) => \{
      chk\.checked = this\.selectedUserIds\.has\(Number\(chk\.value\)\);
    \}\);'''

new_chk_update = r'''    container.querySelectorAll('.member-avatar-btn').forEach((btn) => {
      if (this.selectedUserIds.has(Number(btn.dataset.id))) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });'''

grp_js = re.sub(old_chk_update, new_chk_update, grp_js)


with open('public/js/groupCalendar.js', 'w', encoding='utf-8') as f:
    f.write(grp_js)
print("groupCalendar.js rewritten")
