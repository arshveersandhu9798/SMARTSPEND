(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('authForm'); let mode = 'login';
  const configured = window.SUPABASE_URL && window.SUPABASE_ANON_KEY && !window.SUPABASE_URL.includes('YOUR_') && !window.SUPABASE_ANON_KEY.includes('YOUR_');
  const client = configured && window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
  function setMode(next) {
    mode = next; const signup = mode === 'signup';
    $('loginTab').classList.toggle('active', !signup); $('signupTab').classList.toggle('active', signup);
    $('nameField').classList.toggle('hidden', !signup); $('fullName').required = signup;
    $('formTitle').textContent = signup ? 'Create your account' : 'Welcome back';
    $('formSubtitle').textContent = signup ? 'Sign up to start managing your money.' : 'Enter your details to access your dashboard.';
    $('submitBtn').innerHTML = signup ? 'Create account <span>→</span>' : 'Log in <span>→</span>';
    $('password').autocomplete = signup ? 'new-password' : 'current-password'; $('message').textContent = '';
  }
  $('loginTab').addEventListener('click', () => setMode('login')); $('signupTab').addEventListener('click', () => setMode('signup'));
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); const msg = $('message'), btn = $('submitBtn');
    if (!client) { msg.className = 'message error'; msg.textContent = 'Setup required: add your Supabase Project URL and anon public key in supabase-config.js.'; return; }
    btn.disabled = true; btn.textContent = mode === 'signup' ? 'Creating account…' : 'Logging in…'; msg.textContent = ''; msg.className = 'message';
    try {
      const email = $('email').value.trim(), password = $('password').value;
      if (mode === 'signup') {
        const { data, error } = await client.auth.signUp({ email, password, options: { data: { full_name: $('fullName').value.trim() }, emailRedirectTo: location.origin + location.pathname.replace(/auth\.html?$/i, 'index.html') } });
        if (error) throw error;
        if (data.session) location.href = 'index.html'; else msg.textContent = 'Account created. Check your email to confirm your address, then log in.';
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password }); if (error) throw error; location.href = 'index.html';
      }
    } catch (error) { msg.className = 'message error'; msg.textContent = error.message || 'Something went wrong. Please try again.'; }
    finally { btn.disabled = false; if (mode === 'login') btn.innerHTML = 'Log in <span>→</span>'; else btn.innerHTML = 'Create account <span>→</span>'; }
  });
  if (client) client.auth.getSession().then(({data}) => { if (data.session) location.href = 'index.html'; });
})();
