import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox, QFileDialog, QCheckBox, FileMode, QErrorMessage, QPlainTextEdit } from '@nodegui/nodegui'
import * as IlCookCircuit from './ilCookCircuitScraper.js'
import * as AzMaricopaJC from './azMaricopaJusticeCourts.js'
import puppeteer from 'puppeteer'
import random_useragent from 'random-useragent'

let selectedDocket = 0

const win = new QMainWindow();
win.setWindowTitle('Docket Scraper');

const errorMessage = new QErrorMessage()

//Root view
const rootView = new QWidget();
const rootViewLayout = new FlexLayout();
rootView.setObjectName('rootView');
rootView.setLayout(rootViewLayout);

//Fieldset
const fieldset = new QWidget();
const fieldsetLayout = new FlexLayout();
fieldset.setObjectName('fieldset');
fieldset.setLayout(fieldsetLayout);

const fileDialog = new QFileDialog();

//Select Docket Row
const docketRow = new QWidget();
const docketRowLayout = new FlexLayout();
docketRow.setObjectName('docketRow');
docketRow.setLayout(docketRowLayout)

const selectDocket = new QComboBox();
selectDocket.addItem(undefined, 'Select a Docket');
selectDocket.addItem(undefined, 'IL Cook Circuit');
selectDocket.addItem(undefined, 'AZ Maricopa Justice Court')

fieldsetLayout.addWidget(docketRow);
fieldsetLayout.addWidget(selectDocket);
rootViewLayout.addWidget(fieldset);

selectDocket.addEventListener('currentIndexChanged', (index) => {
    if (index === 0) {
        caseNumRow.setHidden(true);
        selectedDocket = 0;
    } else if (index === 1) {
        caseNumRow.setHidden(false);
        selectedDocket = 1;
    } else if (index === 2) {
        caseNumRow.setHidden(false);
        selectedDocket = 2;
    }
})

//Case Number Input Fields
const caseNumRow = new QWidget();
const caseNumRowLayout = new FlexLayout();
caseNumRow.setObjectName('caseNumRow');
caseNumRow.setLayout(caseNumRowLayout)

const yearDivRow = new QWidget();
const yearDivRowLayout = new FlexLayout();
yearDivRow.setObjectName('yearDivRow')
yearDivRow.setLayout(yearDivRowLayout)
caseNumRowLayout.addWidget(yearDivRow)

const yearLabel = new QLabel();
yearLabel.setText('Year (YYYY)')
yearDivRowLayout.addWidget(yearLabel)

const yearInput = new QLineEdit();
yearInput.setObjectName('yearInput')
yearDivRowLayout.addWidget(yearInput)

const divLabel = new QLabel();
divLabel.setText('Division (D)')
yearDivRowLayout.addWidget(divLabel)

const divInput = new QLineEdit();
divInput.setObjectName('divInput')
yearDivRowLayout.addWidget(divInput)

const seqRow = new QWidget();
const seqRowLayout = new FlexLayout();
seqRow.setObjectName('seqRow')
seqRow.setLayout(seqRowLayout)
caseNumRowLayout.addWidget(seqRow)

const startSeqLabel = new QLabel();
startSeqLabel.setText('Starting Sequence (123456)')
seqRowLayout.addWidget(startSeqLabel)

const startSeqInput = new QLineEdit();
startSeqInput.setObjectName('startSeqInput')
seqRowLayout.addWidget(startSeqInput)

const endSeqLabel = new QLabel();
endSeqLabel.setText('Ending Sequence (123456)')
seqRowLayout.addWidget(endSeqLabel)

const endSeqInput = new QLineEdit();
endSeqInput.setObjectName('endSeqInput')
seqRowLayout.addWidget(endSeqInput)

//Donwload file input fields
const autoDownloadCheckbox = new QCheckBox();
autoDownloadCheckbox.setText("Automatically download all cases after scrape");
autoDownloadCheckbox.setChecked(true);
seqRowLayout.addWidget(autoDownloadCheckbox);

const fileNameLabel = new QLabel();
fileNameLabel.setText('File Name')
seqRowLayout.addWidget(fileNameLabel)

const fileNameInput = new QLineEdit();
fileNameInput.setObjectName('fileNameInput')
seqRowLayout.addWidget(fileNameInput)

//Output to track current case being scraped
const progressTracker = new QPlainTextEdit();
progressTracker.setObjectName('progressTracker');
progressTracker.setReadOnly(true);
rootViewLayout.addWidget(progressTracker)

//Button row
const buttonRow =  new QWidget();
const buttonRowLayout = new FlexLayout();
buttonRow.setObjectName('buttonRow');
buttonRow.setLayout(buttonRowLayout);

//Buttons
const startButton = new QPushButton();
startButton.setText('Start');
startButton.setObjectName('startButton');

const downloadButton = new QPushButton();
downloadButton.setText('Download');
downloadButton.setObjectName('downloadButton');

const clearDbButton = new QPushButton();
clearDbButton.setText('Clear Database');
clearDbButton.setObjectName('clearDbButton');

//Add widgets to their respective layouts
fieldsetLayout.addWidget(caseNumRow);
buttonRowLayout.addWidget(startButton);
buttonRowLayout.addWidget(downloadButton);
buttonRowLayout.addWidget(clearDbButton);
rootViewLayout.addWidget(buttonRow);
caseNumRow.setHidden(true);

//Styling
const rootStyleSheet = `
    #rootView {
        padding: 5px;
    }
    #fieldset {
        padding: 10px;
        border: 2px ridge #bdbdbd;
        margin-bottom: 4px;
    }
    #caseNumRow {
        flex-direction: column;
        margin-bottom: 5px;
    }
    #seqRowLayout, #yearDivRowLayout {
        flex-direction: row;
    }
    #startSeqInput, #endSeqInput, #yearInput, #divInput {
        margin-left: 2px;
        width: '45%';
    }
    #progressTracker{
        height: 60px;
        margin-bottom: 4px;
    }
    #buttonRow{
        margin-bottom: 5px;
        flex-direction: row;
    }
`;
rootView.setStyleSheet(rootStyleSheet);

//Event handling
startButton.addEventListener('clicked', async function() {
    if (selectedDocket === 1) {
        //scrape IL cook circuit docket
        let startSeq = Number(startSeqInput.text())
        const endSeq = Number(endSeqInput.text())
        const year = yearInput.text()
        const div = divInput.text()
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.setDefaultNavigationTimeout(60000)
        await page.setUserAgent(random_useragent.getRandom())
        await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')

        for (let i = startSeq; i <= endSeq; i++) {
            const caseNumStr = IlCookCircuit.formatCaseNum([year, div, i])
            progressTracker.setPlainText(`Searching case: ${caseNumStr}`)
            const caseFound = await IlCookCircuit.searchCaseNum(browser, page, div, caseNumStr)
            if (caseFound) {
                progressTracker.setPlainText(`Case found, scraping data: ${caseNumStr}`)
                await IlCookCircuit.scrapeDocket(browser, page, div)
                await Promise.all([
                    page.click('#MainContent_btnSearch2'),
                    page.waitForNavigation({waitfor: 'domcontentloaded'})
                ])

            } else {
                progressTracker.setPlainText(`Case not found: ${caseNumStr}`)
            }
        }
        await browser.close();

        if (autoDownloadCheckbox.isChecked(true)) {
            fileDialog.setFileMode(FileMode.Directory)   ;     
            fileDialog.exec();
            const location = fileDialog.selectedFiles();
            const fileName = fileNameInput.text();
            if (fileDialog.result() == 1 && fileName.length > 0) {
                AzMaricopaJC.downloadCsv(`${location}\\${fileName}.csv`);
            } else {
                errorMessage.showMessage('Please enter a file name.');
            };
        };
        
    } if (selectedDocket === 2) { 
        //scrape AZ Maricopa Justice Courts docket
        let startSeq = Number(startSeqInput.text())
        const endSeq = Number(endSeqInput.text())
        const year = yearInput.text()
        const div = divInput.text()
        const browser = await puppeteer.launch()
        const page = await browser.newPage()
        await page.setDefaultNavigationTimeout(60000)
        await page.setUserAgent(random_useragent.getRandom())
        await AzMaricopaJC.navigateToPage(browser, page, 'https://justicecourts.maricopa.gov/app/courtrecords/CaseSearch?q=cn')

        for (let i = startSeq; i <= endSeq; i++) {
            const caseNumStr = AzMaricopaJC.formatCaseNum([year, div, i])
            progressTracker.setPlainText(`Searching case: ${caseNumStr}`)
            const caseFound = await AzMaricopaJC.searchCaseNum(browser, page, div, caseNumStr)
            if (caseFound) {
                progressTracker.setPlainText(`Case found, scraping data: ${caseNumStr}`)
                await AzMaricopaJC.scrapeDocket(browser, page, div)
            } else {
                progressTracker.setPlainText(`Case sealed or not found: ${caseNumStr}`)
                await AzMaricopaJC.sleep(Math.random() * (6000 - 3000 + 1) + 3000)
            }
            await Promise.all([
                page.click('.jc-btn-back'),
                page.waitForNavigation({waitfor: 'domcontentloaded'})
            ])
        }
        await browser.close();   

        if (autoDownloadCheckbox.isChecked(true)) {
            fileDialog.setFileMode(FileMode.Directory)   ;     
            fileDialog.exec();
            const location = fileDialog.selectedFiles();
            const fileName = fileNameInput.text();
            if (fileDialog.result() == 1 && fileName.length > 0) {
                AzMaricopaJC.downloadCsv(`${location}\\${fileName}.csv`);
            } else {
                errorMessage.showMessage('Please enter a file name.');
            };
        };

    } else if (selectedDocket === 0) {
        errorMessage.showMessage('Select a docket to scrape from.')
    }
})

downloadButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        fileDialog.setFileMode(FileMode.Directory)        
        fileDialog.exec()
        const location = fileDialog.selectedFiles();
        const fileName = fileNameInput.text();

        if (fileDialog.result() == 1 && fileName.length > 0) {
            IlCookCircuit.downloadCsv(`${location}\\${fileName}.csv`)
        } else {
            errorMessage.showMessage('Please enter a file name.')
        }
        
    } else if (selectedDocket === 2) {
        fileDialog.setFileMode(FileMode.Directory)        
        fileDialog.exec()
        const location = fileDialog.selectedFiles();
        const fileName = fileNameInput.text();
        if (fileDialog.result() == 1 && fileName.length > 0) {
            AzMaricopaJC.downloadCsv(`${location}\\${fileName}.csv`)
        } else {
            errorMessage.showMessage('Please enter a file name.')
        }
    } else {
        errorMessage.showMessage('Select a docket to download from.')
    }
})

clearDbButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //throw popup to confirm
        IlCookCircuit.deleteAllData()
        progressTracker.setPlainText(`All cases deleted from database.`)
    } else if (selectedDocket === 2) {
        AzMaricopaJC.deleteAllData()
    } else {
        errorMessage.showMessage('Select a docket delete data from.')
    }
})

win.setCentralWidget(rootView);
win.show();

global.win = win;