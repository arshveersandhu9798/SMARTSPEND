(async function () {
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  if (!configured || !window.supabase) { location.replace('auth.html'); return; }
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) { location.replace('auth.html'); return; }
  window.smartSpendUserId = data.session.user.id;
  const displayName = data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0] || 'User';
  const nameNode = document.getElementById('sidebarUserName'); if (nameNode) nameNode.textContent = displayName;
  const avatar = document.getElementById('sidebarUserAvatar'); if (avatar) avatar.textContent = displayName.split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase();
  const logout = document.getElementById('logoutBtn');
  if (logout) logout.addEventListener('click', async () => { logout.disabled = true; const { error: signOutError } = await client.auth.signOut(); if (signOutError) { alert(signOutError.message); logout.disabled = false; } else location.replace('auth.html'); });
  const app = document.createElement('script'); app.src = 'script.js'; document.body.appendChild(app);
})();
