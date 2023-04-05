import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox, QFileDialog, FileMode, QErrorMessage, QPlainTextEdit } from '@nodegui/nodegui'
import * as IlCookCircuit from './ilCookCircuitScraper.js'
// import { join } from 'path'
// import { tmpdir } from 'os'
// const tmpPath = tmpdir()
// const chromePath = join(tmpPath, '.local-chromium')
import puppeteer from 'puppeteer'
// const browserFetcher = puppeteer.createBrowserFetcher({
//     path: chromePath
//})
// const revisionInfo = await browserFetcher.download('809590')
// const browser = await puppeteer.launch({
//     headless: false,
//     executablePath: revisionInfo.executablePath,
// })


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
        let startSeq = Number(startSeqInput.text())
        const endSeq = Number(endSeqInput.text())
        const year = yearInput.text();
        const div = divInput.text();
        //const browser = await puppeteer.launch();
        const isPkg = typeof process.pkg !== 'undefined';
        const chromiumExecutablePath = (isPkg ? puppeteer.executablePath().replace(
            /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
            path.join(path.dirname(process.execPath), 'puppeteer')
            )
        : puppeteer.executablePath()
        )
        const browser = await puppeteer.launch({executablePath: chromiumExecutablePath})
        const page = await browser.newPage();
        await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')
        await page.screenshot({path: `foundSite.png`, fullPage: true})
        for (let i = startSeq; i <= endSeq; i++) {
            const caseNumStr = IlCookCircuit.formatCaseNum([year, div, i])
            progressTracker.setPlainText(`Searching case: ${caseNumStr}`)
            const caseFound = await IlCookCircuit.searchCaseNum(browser, page, div, caseNumStr)
            if (caseFound) {
                progressTracker.setPlainText(`Case found, scraping data: ${caseNumStr}`)
                await IlCookCircuit.scrapeDocket(browser, page, div)
                await Promise.all([
                    page.click('#MainContent_btnSearch2'),
                    page.waitForNavigation({waitfor: 'networkidle0'})
                ])

            } else {
                progressTracker.setPlainText(`Case not found: ${caseNumStr}`)
            }
        }
        await browser.close();

        // fileDialog.setFileMode(FileMode.Directory)        
        // fileDialog.exec()
        // const location = fileDialog.selectedFiles();
        // const fileName = fileNameInput.text();

        // if (fileDialog.result() == 1 && fileName.length > 0) {
        //     IlCookCircuit.downloadCsv(`${location}\\${fileName}.csv`)
        // } else {
        //     errorMessage.showMessage('Please enter a file name.')
        // }

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
        
    } else {
        errorMessage.showMessage('Select a docket to download from.')
    }
})

clearDbButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //throw popup to confirm
        IlCookCircuit.deleteAllData()
        progressTracker.setPlainText(`All cases deleted from database.`)
    } else {
        errorMessage.showMessage('Select a docket delete data from.')
    }
})

win.setCentralWidget(rootView);
win.show();

global.win = win;