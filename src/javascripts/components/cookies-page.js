import { getConsentCookie, setConsentCookie } from '../cookie-functions.js'
import common from 'govuk-frontend/govuk/common'

const nodeListForEach = common.nodeListForEach

const cookieOptionSelector = '[data-module="app-cookies-page__option"]'
const errorSummarySelector = '[data-module="app-cookies-page__error-summary"]'
const saveButtonSelector = '[data-module="app-cookies-page__save"]'
const successNotificationSelector = '[data-module="app-cookies-page__success"]'

function CookiesPage ($module) {
  this.$module = $module
}

CookiesPage.prototype.init = function () {
  this.$cookiePage = this.$module

  if (!this.$cookiePage) {
    return
  }

  this.$cookieOptions = this.$cookiePage.querySelectorAll(cookieOptionSelector)
  this.$errorSummary = this.$cookiePage.querySelector(errorSummarySelector)
  this.$saveButton = this.$cookiePage.querySelector(saveButtonSelector)
  this.$successNotification = this.$cookiePage.querySelector(successNotificationSelector)

  this.userCookiePreferences = getConsentCookie()

  nodeListForEach(this.$cookieOptions, function ($cookieOption) {
    this.showUserPreference($cookieOption, this.userCookiePreferences)
    $cookieOption.removeAttribute('hidden')
  }.bind(this))

  this.$saveButton.addEventListener('click', this.savePreferences.bind(this))
  this.$saveButton.removeAttribute('hidden')
}

CookiesPage.prototype.savePreferences = function () {
  var preferences = {}

  nodeListForEach(this.$cookieOptions, function ($cookieOption) {
    var cookieType = this.getCookieType($cookieOption)
    var selected = $cookieOption.querySelector(':checked')

    if (selected === null) {
      this.showErrorMessage($cookieOption)
      return
    } else {
      this.hideErrorMessage($cookieOption)
    }

    preferences[cookieType] = selected.value === 'yes'
  }.bind(this))

  // if there are any errors, show error summary and don't submit
  var $errors = this.$cookiePage.querySelectorAll('.govuk-error-message')
  if ($errors.length !== 0) {
    this.showErrorSummary($errors)
    return
  }

  // otherwise save preferences to cookie and show success notification
  setConsentCookie(preferences)
  this.hideErrorSummary()
  this.showSuccessNotification()
}

CookiesPage.prototype.showUserPreference = function ($cookieOption, preferences) {
  if (!preferences) {
    return
  }

  var cookieType = this.getCookieType($cookieOption)

  if (!cookieType || preferences[cookieType] === undefined) {
    return
  }

  var preference = preferences[cookieType]

  if (preference === true) {
    $cookieOption.querySelectorAll('input[value="yes"]').checked = true
  } else if (preference === false) {
    $cookieOption.querySelector('input[value="no"]').checked = true
  }
}

/* Hide an error message for a cookie option. */
CookiesPage.prototype.hideErrorMessage = function ($cookieOption) {
  var errorMessage = $cookieOption.querySelector('.govuk-error-message')
  if (errorMessage !== null) {
    errorMessage.parentNode.removeChild(errorMessage)
  }

  var errorMessageHighlight = $cookieOption.querySelector('.govuk-form-group--error')
  errorMessageHighlight && errorMessageHighlight.classList.remove('govuk-form-group--error')
}

/* Show an error message for a cookie option.
 *
 * If the user has not selected yes or no to accept a cookie type, we want to
 * show an error message.
 */
CookiesPage.prototype.showErrorMessage = function ($cookieOption) {
  // Do not show error message more than once
  if ($cookieOption.querySelector('.govuk-error-message')) {
    return
  }

  var cookieType = this.getCookieType($cookieOption)

  // error message is defined in error summary macro call in template
  var errorMessageText = this.$errorSummary.querySelector('a[href="#' + cookieType + '"]').innerText

  var formGroup = $cookieOption.querySelector('.govuk-form-group')
  formGroup && formGroup.classList.add('govuk-form-group--error')

  var errorMessageSpan = document.createElement('span')
  errorMessageSpan.className = 'govuk-error-message'
  errorMessageSpan.innerHTML = '<span class="govuk-visually-hidden">Error:</span> ' + errorMessageText

  var siblingElement = $cookieOption.querySelector('.govuk-radios')
  var parentElement = siblingElement.parentElement
  parentElement.insertBefore(errorMessageSpan, siblingElement)
}

CookiesPage.prototype.hideErrorSummary = function () {
  this.$errorSummary.setAttribute('hidden', '')
}

CookiesPage.prototype.showErrorSummary = function ($errors) {
  this.$errorSummary.removeAttribute('hidden')

  this.$errorSummary.firstElementChild.focus()

  // scroll to the top of the page
  document.body.scrollTop = document.documentElement.scrollTop = 0
}

CookiesPage.prototype.showSuccessNotification = function () {
  this.$successNotification.removeAttribute('hidden')

  var $notificationBanner = this.$successNotification.firstElementChild

  // Set tabindex to -1 to make the element focusable with JavaScript.
  // GOV.UK Frontend will remove the tabindex on blur as the component doesn't
  // need to be focusable after the user has read the text.
  if (!$notificationBanner.getAttribute('tabindex')) {
    $notificationBanner.setAttribute('tabindex', '-1')
  }

  $notificationBanner.focus()

  // scroll to the top of the page
  document.body.scrollTop = document.documentElement.scrollTop = 0
}

CookiesPage.prototype.getCookieType = function ($cookieOption) {
  return $cookieOption.querySelector('input').name
}

export default CookiesPage
