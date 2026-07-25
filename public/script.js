(function () {
  const form = document.getElementById('lead-form');
  const submitBtn = document.getElementById('submit-btn');
  const statusBox = document.getElementById('form-status');
  const messageInput = document.getElementById('message');
  const charCount = document.getElementById('char-count');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  messageInput.addEventListener('input', () => {
    charCount.textContent = messageInput.value.length;
  });

  function setFieldError(fieldName, msg) {
    const field = document.getElementById(`field-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (!field || !errorEl) return;
    field.classList.add('has-error');
    errorEl.textContent = msg;
  }

  function clearFieldError(fieldName) {
    const field = document.getElementById(`field-${fieldName}`);
    const errorEl = document.getElementById(`error-${fieldName}`);
    if (!field || !errorEl) return;
    field.classList.remove('has-error');
    errorEl.textContent = '';
  }

  function clearAllErrors() {
    ['name', 'email', 'budgetRange', 'message'].forEach(clearFieldError);
  }

  // --- Client-side validation (fast feedback; server re-checks everything) ---
  function validate(data) {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = 'Please enter your name (at least 2 characters).';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Name is too long.';
    }

    if (!data.email || !EMAIL_RE.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!data.budgetRange) {
      errors.budgetRange = 'Please select a budget range.';
    }

    if (!data.message || data.message.trim().length < 10) {
      errors.message = 'Please add a bit more detail (at least 10 characters).';
    } else if (data.message.trim().length > 2000) {
      errors.message = 'Message is too long (max 2000 characters).';
    }

    return errors;
  }

  function showStatus(type, text) {
    statusBox.className = `form-status ${type}`;
    statusBox.textContent = text;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    statusBox.className = 'form-status';
    statusBox.textContent = '';

    const data = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      budgetRange: document.getElementById('budgetRange').value,
      message: document.getElementById('message').value
    };

    const errors = validate(data);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, msg]) => setFieldError(field, msg));
      showStatus('error', 'Please fix the highlighted fields and try again.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, msg]) => setFieldError(field, msg));
        }
        showStatus('error', result.message || 'Please fix the highlighted fields and try again.');
        return;
      }

      form.reset();
      charCount.textContent = '0';
      showStatus('success', "Thanks — that's in. We'll be in touch within one business day.");
    } catch (err) {
      showStatus('error', 'Network error. Please check your connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send inquiry';
    }
  });
})();
