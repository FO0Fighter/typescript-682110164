*** Settings ***
Documentation     Web UI automated test suite for the List Web App
Library           SeleniumLibrary
Test Teardown     Close Browser

*** Variables ***
# Default URL is local dev, or can be overridden via command-line:
# robot --variable URL:https://testappoftest.azurewebsites.net tests/web_test.robot
${URL}            http://localhost:3000
${BROWSER}        chrome
${INPUT_ITEM}     Learn Robot Framework

*** Test Cases ***
Verify Page Loads Successfully
    [Documentation]    Verify page title and main form elements exist
    Open Browser To App
    Title Should Be    List
    Page Should Contain Element    id:add-input
    Page Should Contain Element    xpath://button[@type='submit']

Add New Item To List
    [Documentation]    Type a new item into the input box and submit
    Open Browser To App
    Wait Until Element Is Visible    id:add-input    timeout=10s
    Input Text                       id:add-input    ${INPUT_ITEM}
    Click Button                     xpath://button[@type='submit']
    Wait Until Page Contains Element    xpath://ul[@id='list']/li    timeout=10s
    Page Should Contain              ${INPUT_ITEM}

*** Keywords ***
Open Browser To App
    Open Browser    ${URL}    ${BROWSER}
    Maximize Browser Window
