/* eslint-env jest */

const { setupPage } = require('../lib/jest-utilities.js')
const configPaths = require('../config/paths.json')
const PORT = configPaths.testPort

let page
const baseUrl = 'http://localhost:' + PORT

const cookiesPageSelector = '[data-module="app-cookies-page"]'

beforeAll(async () => {
  page = await setupPage()
})

afterAll(async () => {
  await page.close()
})

describe('Cookies page', () => {
  beforeEach(async () => {
    await page.goto(`${baseUrl}/cookies`)
  })

  afterEach(async () => {
    await page.deleteCookie({ name: 'design_system_cookies_policy' })
    await page.setJavaScriptEnabled(true)
  })

  it('without JavaScript it has no visible inputs', async () => {
    await page.setJavaScriptEnabled(false)
    await page.goto(`${baseUrl}/cookies`)

    const isAnalyticsOptionHidden = await page.waitForSelector(
      cookiesPageSelector + ' input[type="radio"][name="analytics"]', { hidden: true }
    )
    expect(isAnalyticsOptionHidden).toBeTruthy()

    const isSaveButtonHidden = await page.waitForSelector(
      cookiesPageSelector + ' button', { hidden: true }
    )
    expect(isSaveButtonHidden).toBeTruthy()
  })

  it('has radios for each cookie type', async () => {
    const isAnalyticsOptionVisible = await page.waitForSelector(
      cookiesPageSelector + ' input[type="radio"][name="analytics"]', { visible: true }
    )
    expect(isAnalyticsOptionVisible).toBeTruthy()
  })

  it('has a save button', async () => {
    const isSaveButtonVisible = await page.waitForSelector(
      cookiesPageSelector + ' button', { visible: true }
    )
    expect(isSaveButtonVisible).toBeTruthy()
  })

  it('has no errors visible when loaded', async () => {
    await expectErrorsToBeHidden(page)
  })

  it('shows errors if the user does not select preferences', async () => {
    await page.click(cookiesPageSelector + ' button')

    await expectErrorsToBeVisible(page)
  })

  it('shows success notification banner after preferences are saved', async () => {
    const isSuccessNotificationHidden = await page.waitForSelector(
      cookiesPageSelector + ' .govuk-notification-banner--success', { hidden: true }
    )
    expect(isSuccessNotificationHidden).toBeTruthy()

    await page.click(cookiesPageSelector + ' input[name="analytics"]')
    await page.click(cookiesPageSelector + ' button')

    const isSuccessNotificationVisible = await page.waitForSelector(
      cookiesPageSelector + ' .govuk-notification-banner--success', { visible: true }
    )
    expect(isSuccessNotificationVisible).toBeTruthy()
  })

  it('hides errors after successful form submission', async () => {
    // Submit form with errors
    await page.click(cookiesPageSelector + ' button')

    await expectErrorsToBeVisible(page)

    // Fix errors and re-submit
    await page.click(cookiesPageSelector + ' input[name="analytics"]')
    await page.click(cookiesPageSelector + ' button')

    await expectErrorsToBeHidden(page)
  })

  it('saves user preferences to a cookie', async () => {
    await page.click(cookiesPageSelector + ' input[name="analytics"][value="yes"]')
    await page.click(cookiesPageSelector + ' button')

    expect(await page.cookies()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'design_system_cookies_policy',
          value: '{"analytics":true,"version":1}'
        })
      ])
    )

    await page.click(cookiesPageSelector + ' input[name="analytics"][value="no"]')
    await page.click(cookiesPageSelector + ' button')

    expect(await page.cookies()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'design_system_cookies_policy',
          value: '{"analytics":false,"version":1}'
        })
      ])
    )
  })

  it('shows the users existing preferences when the page is loaded', async () => {
    await page.click(cookiesPageSelector + ' input[name="analytics"][value="no"]')
    await page.click(cookiesPageSelector + ' button')

    await page.goto(`${baseUrl}/cookies`)

    const isAnalyticsDisagreeOptionSelected = await page.waitForSelector(
      cookiesPageSelector + ' input[name="analytics"][value="no"]:checked', { visible: true }
    )
    expect(isAnalyticsDisagreeOptionSelected).toBeTruthy()

    await page.click(cookiesPageSelector + ' input[name="analytics"][value="yes"]')
    await page.click(cookiesPageSelector + ' button')

    const isAnalyticsAgreeOptionSelected = await page.waitForSelector(
      cookiesPageSelector + ' input[name="analytics"][value="yes"]:checked', { visible: true }
    )
    expect(isAnalyticsAgreeOptionSelected).toBeTruthy()
  })
})

async function expectErrorsToBeHidden (page) {
  const isErrorSummaryHidden = await page.waitForSelector(
    cookiesPageSelector + ' .govuk-error-summary', { hidden: true }
  )
  expect(isErrorSummaryHidden).toBeTruthy()

  const isAnalyticsErrorMessagePresent = await page.waitForSelector(
    cookiesPageSelector + ' .govuk-error-message + .govuk-radios [name="analytics"]', { hidden: true }
  )
  expect(isAnalyticsErrorMessagePresent).not.toBeTruthy()
}

async function expectErrorsToBeVisible (page) {
  const isErrorSummaryVisible = await page.waitForSelector(
    cookiesPageSelector + ' .govuk-error-summary', { visible: true }
  )
  expect(isErrorSummaryVisible).toBeTruthy()

  const isLinkToAnalyticsOptionVisible = await page.waitForSelector(
    cookiesPageSelector + ' .govuk-error-summary a[href="#analytics"]', { visible: true }
  )
  expect(isLinkToAnalyticsOptionVisible).toBeTruthy()

  const isAnalyticsErrorMessageVisible = await page.waitForSelector(
    cookiesPageSelector + ' .govuk-error-message + .govuk-radios [name="analytics"]', { visible: true }
  )
  expect(isAnalyticsErrorMessageVisible).toBeTruthy()
}
