import { buildClientApiUrl } from '../lib/api';
import { authClient } from '../lib/authClient';

// ===== Constants =====
const REGISTER_REDIRECT_URL = '/feed';
const ONBOARDING_REDIRECT_URL = '/onboarding';
const REGISTER_CREATION_TIMEOUT = 2000;
const PROFILE_API_ENDPOINT = buildClientApiUrl('/api/users/profile');
const CURRENT_USER_API_ENDPOINT = buildClientApiUrl('/api/users/me');

// ===== Type Definitions =====
interface RegisterFormData {
  email: string;
  password: string;
  name: string;
  major: string;
  year: string;
}

interface PasswordRequirements {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

// ===== DOM Element References =====
function getRegisterElement<T extends HTMLElement>(id: string): T | null {
  const element = document.getElementById(id);
  return element as T | null;
}

const registerFormElement = getRegisterElement<HTMLFormElement>('registerForm');
const registerEmailElement = getRegisterElement<HTMLInputElement>('email');
const registerNameElement = getRegisterElement<HTMLInputElement>('name');
const registerMajorElement = getRegisterElement<HTMLInputElement>('major');
const registerYearElement = getRegisterElement<HTMLSelectElement>('year');
const registerPasswordElement = getRegisterElement<HTMLInputElement>('password');
const registerSubmitBtnElement = getRegisterElement<HTMLButtonElement>('submitBtn');
const registerSubmitTextElement = getRegisterElement<HTMLElement>('submitText');
const registerSuccessMessageElement = getRegisterElement<HTMLElement>('successMessage');
const registerErrorMessageElement = getRegisterElement<HTMLElement>('errorMessage');
const registerTogglePasswordBtnElement = getRegisterElement<HTMLButtonElement>('togglePassword');

// Validate that all required elements exist
if (!registerFormElement || !registerEmailElement || !registerNameElement || !registerMajorElement || !registerYearElement || !registerPasswordElement || !registerSubmitBtnElement || !registerSubmitTextElement || !registerSuccessMessageElement || !registerErrorMessageElement || !registerTogglePasswordBtnElement) {
  console.error('Missing required form elements for register page');
  throw new Error('Form initialization failed: required elements are missing from the DOM');
}

// Type assertion after validation
const registerForm = registerFormElement as HTMLFormElement;
const regEmail = registerEmailElement as HTMLInputElement;
const regName = registerNameElement as HTMLInputElement;
const regMajor = registerMajorElement as HTMLInputElement;
const regYear = registerYearElement as HTMLSelectElement;
const regPassword = registerPasswordElement as HTMLInputElement;
const regSubmitBtn = registerSubmitBtnElement as HTMLButtonElement;
const regSubmitText = registerSubmitTextElement as HTMLElement;
const regSuccessMessage = registerSuccessMessageElement as HTMLElement;
const regErrorMessage = registerErrorMessageElement as HTMLElement;
const regTogglePasswordBtn = registerTogglePasswordBtnElement as HTMLButtonElement;

// ===== Utility Functions =====

/**
 * Set error message for a specific field
 */
function setRegisterFieldError(fieldId: string, message: string): void {
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (errorElement) {
    errorElement.textContent = message;
  }
}

/**
 * Clear all error messages
 */
function clearRegisterErrors(): void {
  setRegisterFieldError('email', '');
  setRegisterFieldError('name', '');
  setRegisterFieldError('major', '');
  setRegisterFieldError('year', '');
  setRegisterFieldError('password', '');
  regErrorMessage.textContent = '';
  regErrorMessage.style.display = 'none';
}

/**
 * Display a user-friendly error message
 */
function displayRegisterUserError(error: unknown): void {
  let userMessage = 'Registration failed. Please try again.';

  if (error instanceof Error) {
    const errorMsg = error.message.toLowerCase();

    // Categorize errors for user-friendly messages
    if (errorMsg.includes('already exists') || errorMsg.includes('already registered')) {
      userMessage = 'This email is already registered. Please try logging in or use a different email.';
    } else if (errorMsg.includes('invalid') || errorMsg.includes('email')) {
      userMessage = 'Invalid email address. Please check and try again.';
    } else if (errorMsg.includes('password')) {
      userMessage = 'Password does not meet the requirements. Please check all requirements.';
    } else if (errorMsg.includes('network') || errorMsg.includes('failed to fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (errorMsg.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    }
  }

  regErrorMessage.textContent = userMessage;
  regErrorMessage.style.display = 'block';
}

/**
 * Validate password requirements
 */
function validateRegisterPasswordRequirements(password: string): PasswordRequirements {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

/**
 * Check if all password requirements are met
 */
function areAllPasswordRequirementsMet(requirements: PasswordRequirements): boolean {
  return Object.values(requirements).every((req) => req === true);
}

/**
 * Update password requirements display UI
 */
function updatePasswordRequirementsDisplay(password: string): void {
  const requirements = validateRegisterPasswordRequirements(password);

  Object.entries(requirements).forEach(([key, isValid]) => {
    const element = document.getElementById(`requirement-${key}`);
    if (element) {
      const icon = element.querySelector('.requirementIcon');
      if (icon) {
        if (isValid) {
          element.classList.add('valid');
          icon.textContent = '✓';
        } else {
          element.classList.remove('valid');
          icon.textContent = '✗';
        }
      }
    }
  });
}

/**
 * Validate email format
 */
function validateRegisterEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }

  if (!email.endsWith('.edu')) {
    return 'Email must be a .edu domain';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validate name field
 */
function validateRegisterName(name: string): string | null {
  if (!name.trim()) {
    return 'Name is required';
  }

  return null;
}

/**
 * Validate major field
 */
function validateRegisterMajor(major: string): string | null {
  if (!major.trim()) {
    return 'Major is required';
  }

  return null;
}

/**
 * Validate year field
 */
function validateRegisterYear(year: string): string | null {
  if (!year) {
    return 'Year is required';
  }

  return null;
}

/**
 * Validate password field with requirements
 */
function validateRegisterPassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  const requirements = validateRegisterPasswordRequirements(password);

  if (!areAllPasswordRequirementsMet(requirements)) {
    return 'Password does not meet all requirements';
  }

  return null;
}

/**
 * Validate entire form
 */
function validateRegisterForm(): boolean {
  clearRegisterErrors();
  let isValid = true;

  // Validate email
  const emailError = validateRegisterEmail(regEmail.value);
  if (emailError) {
    setRegisterFieldError('email', emailError);
    isValid = false;
  }

  // Validate name
  const nameError = validateRegisterName(regName.value);
  if (nameError) {
    setRegisterFieldError('name', nameError);
    isValid = false;
  }

  // Validate major
  const majorError = validateRegisterMajor(regMajor.value);
  if (majorError) {
    setRegisterFieldError('major', majorError);
    isValid = false;
  }

  // Validate year
  const yearError = validateRegisterYear(regYear.value);
  if (yearError) {
    setRegisterFieldError('year', yearError);
    isValid = false;
  }

  // Validate password
  const passwordError = validateRegisterPassword(regPassword.value);
  if (passwordError) {
    setRegisterFieldError('password', passwordError);
    isValid = false;
  }

  return isValid;
}

/**
 * Extract form data
 */
function getRegisterFormData(): RegisterFormData {
  return {
    email: regEmail.value.trim(),
    password: regPassword.value,
    name: regName.value.trim(),
    major: regMajor.value.trim(),
    year: regYear.value,
  };
}

/**
 * Set loading state on submit button
 */
function setRegisterLoadingState(isLoading: boolean): void {
  regSubmitBtn.disabled = isLoading;
  regSubmitText.textContent = isLoading ? 'Creating Account...' : 'Create Account';
}

/**
 * Show success message and redirect
 */
function handleRegisterSuccess(redirectUrl: string): void {
  regSuccessMessage.textContent = 'Account created successfully! Redirecting...';
  regSuccessMessage.style.display = 'block';

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, REGISTER_CREATION_TIMEOUT);
}

function handleRegisterPartialSuccess(redirectUrl: string): void {
  regSuccessMessage.textContent = 'Account created successfully, but your profile details could not be saved yet. Redirecting...';
  regSuccessMessage.style.display = 'block';
  regErrorMessage.textContent = 'Your account is ready. Please update your profile details after you sign in.';
  regErrorMessage.style.display = 'block';

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, REGISTER_CREATION_TIMEOUT);
}

async function resolveRegisterRedirectUrl(): Promise<string> {
  try {
    const response = await fetch(CURRENT_USER_API_ENDPOINT, {
      credentials: 'include',
    });

    if (!response.ok) {
      return REGISTER_REDIRECT_URL;
    }

    const payload = await response.json();
    return payload?.needsOnboarding ? ONBOARDING_REDIRECT_URL : REGISTER_REDIRECT_URL;
  } catch {
    return REGISTER_REDIRECT_URL;
  }
}

// ===== Event Listeners =====

/**
 * Password toggle visibility
 */
regTogglePasswordBtn.addEventListener('click', (e: MouseEvent): void => {
  e.preventDefault();

  const isPassword = regPassword.type === 'password';
  regPassword.type = isPassword ? 'text' : 'password';

  const toggleIcon = document.getElementById('toggleIcon') as HTMLImageElement | null;
  if (!toggleIcon) {
    console.error('Toggle icon element not found');
    return;
  }

  const eyeIconUrl = regTogglePasswordBtn.dataset.eyeIcon;
  const eyeSlashIconUrl = regTogglePasswordBtn.dataset.eyeSlashIcon;

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
 * Password input event - update requirements display
 */
regPassword.addEventListener('input', (): void => {
  const password = regPassword.value;
  updatePasswordRequirementsDisplay(password);
});

/**
 * Form submission handler
 */
registerForm.addEventListener('submit', async (e: SubmitEvent): Promise<void> => {
  e.preventDefault();

  if (!validateRegisterForm()) {
    return;
  }

  setRegisterLoadingState(true);

  try {
    const formData = getRegisterFormData();

    // Step 1: Create account
    const { data, error } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      fetchOptions: {
        credentials: 'include',
      },
    });

    if (error || !data) {
      const errorMsg = error?.message || 'Registration failed';
      throw new Error(errorMsg);
    }

    // Step 2: Save additional profile data (major and year)
    const profileResponse = await fetch(PROFILE_API_ENDPOINT, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        major: formData.major,
        year: formData.year,
      }),
    });

    if (!profileResponse.ok) {
      const partialRedirectUrl = await resolveRegisterRedirectUrl();
      handleRegisterPartialSuccess(partialRedirectUrl);
      return;
    }

    const redirectUrl = await resolveRegisterRedirectUrl();
    handleRegisterSuccess(redirectUrl);
  } catch (error) {
    displayRegisterUserError(error);
    setRegisterLoadingState(false);
  }
});