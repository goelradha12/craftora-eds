export default function decorate(block) {
  const [imgRow, headingRow, signupRow] = [...block.children];

  const img = imgRow.querySelector('img');
  const heading = headingRow.textContent.trim();
  const signupLink = signupRow.querySelector('a');
  const signupText = signupRow.textContent.replace(signupLink?.textContent || '', '').trim();

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="login--image">${img ? img.outerHTML : ''}</div>
    <div class="login--form">
      <a class="logo-link" href="/">
        <img src="../../assets/logo.webp" alt="Craftora Logo" class="logo-loginPage" width="116" height="24">
      </a>
      <h2 class="section-heading">${heading}</h2>

      <div class="form-error-banner" id="loginError" role="alert" hidden>
        <span class="icon icon-alert-circle" aria-hidden="true"></span>
        <span id="loginErrorMsg"></span>
      </div>

      <form id="loginForm" novalidate>
        <div class="form-group">
          <label for="phone" class="required">Phone Number</label>
          <div class="input-with-icon">
            <span class="icon icon-phone" aria-hidden="true"></span>
            <input type="tel" id="phone" name="phone" class="form-control"
              placeholder="Enter your 10-digit number" autocomplete="tel"
              inputmode="numeric" minlength="10" maxlength="10" pattern="[0-9]{10}" required>
          </div>
          <span class="field-error" id="phoneError"></span>
        </div>

        <div class="form-group">
          <label for="password" class="required">Password</label>
          <div class="input-with-icon">
            <span class="icon icon-lock" aria-hidden="true"></span>
            <input type="password" id="password" name="password" class="form-control"
              placeholder="Enter your password" autocomplete="current-password" required>
            <button type="button" class="eye-toggle" id="togglePassword" aria-label="Show password">
              <span class="icon icon-eye" aria-hidden="true"></span>
            </button>
          </div>
          <span class="field-error" id="passwordError"></span>
        </div>

        <button type="submit" class="submit-btn" id="loginBtn">
          <span class="btn-text">Sign In</span>
          <span class="icon icon-spinner btn-spinner" aria-hidden="true"></span>
        </button>

        <div class="signup-link">
          ${signupText} <a href="${signupLink?.getAttribute('href') || '/signup'}">${signupLink?.textContent || 'Sign up here'}</a>
        </div>
      </form>
    </div>
  `;

  block.className = 'login';
  block.replaceChildren(...wrapper.children);
}
