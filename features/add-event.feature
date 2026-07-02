@add-event
Feature: Add New Event — inline form on /admin/events

  Background:
    Given I open the login page
    And user login into the app

  # ─────────────────────────────────────────────────────────────────
  # TC1 — Happy path. Asserts on title presence in the table, NOT on
  # row count growth, because the app auto-evicts the oldest user event
  # once 6 user events exist (UX-1).
  # ─────────────────────────────────────────────────────────────────
  @TC1 @happy
  Scenario: Happy path — create event with all required fields and verify it appears in the list
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    When I fill the add-event form with:
      | field      | value                                        |
      | title      | QA Conference 2026                           |
      | description | A great QA conference covering automation, accessibility, and AI. |
      | category   | Conference                                   |
      | city       | Bangalore                                    |
      | venue      | Kanteerava Indoor Stadium, Bangalore         |
      | dateTime   | 2027-08-15T09:30                             |
      | price      | 499                                           |
      | totalSeats | 500                                           |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then the admin events table contains a row titled "QA Conference 2026"
    And the title input is empty after a successful submit

  # ─────────────────────────────────────────────────────────────────
  # TC2 — Required-field validation. Category is preselected, so we
  # do NOT assert on a category error (UX-6). Description and image
  # URL are optional and never produce errors.
  # ─────────────────────────────────────────────────────────────────
  @TC2 @validation
  Scenario: Required-field validation — submit empty form, expect per-field error messages
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    And I capture the row count of the admin events table
    When I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then an inline error "Title is required" is shown
    And an inline error "City is required" is shown
    And an inline error "Venue is required" is shown
    And an inline error "Event date is required" is shown
    And an inline error "Enter a valid price (≥ 0)" is shown
    And an inline error "Must have at least 1 seat" is shown
    And the admin events table row count is unchanged

  # ─────────────────────────────────────────────────────────────────
  # TC3a — Past date. Future-dated events only.
  # ─────────────────────────────────────────────────────────────────
  @TC3a @boundary
  Scenario: Boundary — past date is rejected with an inline error
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    And I capture the row count of the admin events table
    When I fill the add-event form with:
      | field      | value             |
      | title      | Past Event Test   |
      | category   | Conference        |
      | city       | Mumbai            |
      | venue      | Test Venue        |
      | dateTime   | 2020-01-15T10:00  |
      | price      | 100               |
      | totalSeats | 50                |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then an inline error "Must be a future date" is shown
    And the admin events table row count is unchanged

  # ─────────────────────────────────────────────────────────────────
  # TC3b — Zero seats. min=1 enforced via custom error (novalidate form).
  # ─────────────────────────────────────────────────────────────────
  @TC3b @boundary
  Scenario: Boundary — zero seats is rejected with an inline error
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    And I capture the row count of the admin events table
    When I fill the add-event form with:
      | field      | value             |
      | title      | Zero Seats Test   |
      | category   | Conference        |
      | city       | Mumbai            |
      | venue      | Test Venue        |
      | dateTime   | 2027-09-15T10:00  |
      | price      | 100               |
      | totalSeats | 0                 |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then an inline error "Must have at least 1 seat" is shown
    And the admin events table row count is unchanged

  # ─────────────────────────────────────────────────────────────────
  # TC3c — Negative price. min=0 enforced via custom error.
  # ─────────────────────────────────────────────────────────────────
  @TC3c @boundary
  Scenario: Boundary — negative price is rejected with an inline error
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    And I capture the row count of the admin events table
    When I fill the add-event form with:
      | field      | value              |
      | title      | Negative Price Test|
      | category   | Conference         |
      | city       | Mumbai             |
      | venue      | Test Venue         |
      | dateTime   | 2027-11-15T10:00   |
      | price      | -50                |
      | totalSeats | 50                 |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then an inline error "Enter a valid price (≥ 0)" is shown
    And the admin events table row count is unchanged

  # ─────────────────────────────────────────────────────────────────
  # TC3d — Invalid image URL. The form is silently rejected (no inline
  # error visible). The only signal is a server-side 400 surfaced in
  # the browser console (UX-2). We assert on (a) no row added and
  # (b) at least one 4xx response captured on this page.
  # ─────────────────────────────────────────────────────────────────
  @TC3d @boundary @silent-rejection
  Scenario: Boundary — invalid image URL is silently rejected (server 400, no inline error)
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    And I capture the row count of the admin events table
    And I clear the captured 4xx responses
    When I fill the add-event form with:
      | field      | value             |
      | title      | Bad URL Test      |
      | category   | Conference        |
      | city       | Mumbai            |
      | venue      | Test Venue        |
      | dateTime   | 2027-10-15T10:00  |
      | price      | 100               |
      | totalSeats | 50                |
      | imageUrl   | not-a-url         |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then the admin events table row count is unchanged
    And at least one 4xx response was captured on this page

  # ─────────────────────────────────────────────────────────────────
  # TC4 — Optional fields. Price=0 is accepted. Description and image
  # URL may be omitted. Asserts on title presence for both events.
  # ─────────────────────────────────────────────────────────────────
  @TC4 @optional
  Scenario: Optional fields — a minimal event and a fully-populated event both persist
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle

    # 4a — minimal submit (no description, no image, price=0)
    When I fill the add-event form with:
      | field      | value                |
      | title      | Minimal Event Test   |
      | category   | Conference           |
      | city       | Delhi                |
      | venue      | Somewhere, Delhi     |
      | dateTime   | 2027-12-01T08:00     |
      | price      | 0                    |
      | totalSeats | 100                  |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then the admin events table contains a row titled "Minimal Event Test"

    # 4b — fully-populated submit (all fields including imageUrl)
    When I fill the add-event form with:
      | field       | value                                                       |
      | title       | Full Optional Event                                         |
      | description | Event with all optional fields populated for verification.   |
      | category    | Festival                                                    |
      | city        | Pune                                                        |
      | venue       | Full Venue Address, Pune                                    |
      | dateTime    | 2027-12-15T14:00                                            |
      | price       | 250                                                         |
      | totalSeats  | 250                                                         |
      | imageUrl    | https://picsum.photos/seed/fullopt/1200/600                 |
    And I click the "+ Add Event" submit button
    And I wait 5 seconds for the page to settle
    Then the admin events table contains a row titled "Full Optional Event"

  # ─────────────────────────────────────────────────────────────────
  # TC5 — No Cancel button. Form state is lost on navigate-away +
  # browser back. Asserts no Cancel/Reset/Clear/Discard button exists,
  # then verifies the title input is empty after navigating away to /
  # via the header logo and pressing browser back.
  # ─────────────────────────────────────────────────────────────────
  @TC5 @navigation
  Scenario: Cancel / back navigation — no Cancel button exists, and form state is lost across navigation
    Given I am on the admin events page
    And I wait 5 seconds for the page to settle
    When I fill the title input with "Unfinished Event"
    And I fill the city input with "X"
    And I fill the venue input with "Y"
    Then no Cancel button exists on the form
    When I navigate to the EventHub root via the header logo
    And I wait 5 seconds for the page to settle
    And I press the browser back button
    And I wait 5 seconds for the page to settle
    Then the title input is empty
