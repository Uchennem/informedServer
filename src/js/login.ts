import { authClient } from '../lib/authClient';

// ===== Constants =====
const LOGIN_REDIRECT_URL = '/feed';
const LOGIN_SIGN_IN_TIMEOUT = 2000;

// ===== Type Definitions =====
interface LoginFormData {
  email: string;
  password: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
}

// ===== DOM Element References =====
function getLoginElement<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id);
  return element as T | null;
}

const loginForm = getLoginElement<HTMLFormElement>('loginForm');
const loginEmailInput = getLoginElement<HTMLInputElement>('email');
const loginPasswordInput = getLoginElement<HTMLInputElement>('password');
const loginSubmitBtn = getLoginElement<HTMLButtonElement>('submitBtn');
const loginSubmitText = getLoginElement<HTMLElement>('submitText');
const loginSuccessMessage = getLoginElement<HTMLElement>('successMessage');
const loginErrorMessage = getLoginElement<HTMLElement>('errorMessage');
const loginTogglePasswordBtn = getLoginElement<HTMLButtonElement>('togglePassword');

// Validate that all required elements exist
if (!loginForm || !loginEmailInput || !loginPasswordInput || !loginSubmitBtn || !loginSubmitText || !loginSuccessMessage || !loginErrorMessage || !loginTogglePasswordBtn) {
  console.error('Missing required form elements for login page');
  throw new Error('Form initialization failed: required elements are missing from the DOM');
}

// Type assertion after validation
const form = loginForm as HTMLFormElement;
const emailInput = loginEmailInput as HTMLInputElement;
const passwordInput = loginPasswordInput as HTMLInputElement;
const submitBtn = loginSubmitBtn as HTMLButtonElement;
const submitText = loginSubmitText as HTMLElement;
const successMessage = loginSuccessMessage as HTMLElement;
const errorMessage = loginErrorMessage as HTMLElement;
const togglePasswordBtn = loginTogglePasswordBtn as HTMLButtonElement;

// ===== Utility Functions =====

/**
 * Set error message for a specific field
 */
function setLoginFieldError(fieldId: string, message: string): void {
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Clear all error messages
 */
function clearLoginErrors(): void {
  setLoginFieldError('email', '');
  setLoginFieldError('password', '');
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

/**
 * Display a user-friendly error message
 */
function displayLoginUserError(error: unknown): void {
  let userMessage = 'Sign in failed. Please try again.';

  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();

    // Categorize errors for user-friendly messages
    if (errorMsg.includes('invalid') || errorMsg.includes('credentials') || errorMsg.includes('password') || errorMsg.includes('email')) {
      userMessage = 'Invalid email or password. Please try again.';
    } else if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
      userMessage = 'No account found with this email. Please register first.';
    } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (errorMsg.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    }
  }

  errorMessage.textContent = userMessage;
  errorMessage.style.display = 'block';
}

/**
 * Validate email format
 */
function validateLoginEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validate password field
 */
function validateLoginPassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  return null;
}

/**
 * Validate entire form
 */
function validateLoginForm(): boolean {
  clearLoginErrors();
  let isValid = true;

  // Validate email
  const emailError = validateLoginEmail(emailInput.value);
  if (emailError) {
    setLoginFieldError('email', emailError);
    isValid = false;
  }

  // Validate password
  const passwordError = validateLoginPassword(passwordInput.value);
  if (passwordError) {
    setLoginFieldError('password', passwordError);
    isValid = false;
  }

  return isValid;
}

/**
 * Extract form data
 */
function getLoginFormData(): LoginFormData {
  return {
    email: emailInput.value.trim(),
    password: passwordInput.value,
  };
}

/**
 * Set loading state on submit button
 */
function setLoginLoadingState(isLoading: boolean): void {
  submitBtn.disabled = isLoading;
  submitText.textContent = isLoading ? 'Signing In...' : 'Sign In';
}

/**
 * Show success message and redirect
 */
function handleLoginSignInSuccess(): void {
  successMessage.textContent = 'Sign in successful! Redirecting...';
  successMessage.style.display = 'block';

  setTimeout(() => {
    window.location.href = LOGIN_REDIRECT_URL;
  }, LOGIN_SIGN_IN_TIMEOUT);
}

// ===== Event Listeners =====

/**
 * Password toggle visibility
 */
togglePasswordBtn.addEventListener('click', (e: MouseEvent): void => {
  e.preventDefault();

  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';

  const toggleIcon = document.getElementById('toggleIcon') as HTMLImageElement | null;
  if (!toggleIcon) {
    console.error('Toggle icon element not found');
    return;
  }

  const eyeIconUrl = togglePasswordBtn.dataset.eyeIcon;
  const eyeSlashIconUrl = togglePasswordBtn.dataset.eyeSlashIcon;

  if (!eyeIconUrl || !eyeSlashIconUrl) {
    console.error('Missing icon URLs in data attributes');
    return;
  }

  if (isPassword) {
    // Switching to text - show eye-slash icon
    toggleIcon.src = eyeSlashIconUrl;
    toggleIcon.alt = 'Hide password';
  } else {
    // Switching to password - show eye icon
    toggleIcon.src = eyeIconUrl;
    toggleIcon.alt = 'Show password';
  }
});

/**
 * Form submission handler
 */
form.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
  e.preventDefault();

  if (!validateLoginForm()) {
    return;
  }

  setLoginLoadingState(true);

  try {
    const formData = getLoginFormData();

    const { data, error } = await authClient.signIn.email({
      email: formData.email,
      password: formData.password,
      fetchOptions: {
        credentials: 'include',
      },
    });

    if (error || !data) {
      const errorMsg = error?.message || 'Sign in failed. Please check your credentials.';
      throw new Error(errorMsg);
    }

    handleLoginSignInSuccess();
  } catch (error) {
    displayLoginUserError(error);
    setLoginLoadingState(false);
  }
});