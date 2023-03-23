import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox, QFileDialog, FileMode, QErrorMessage, QPlainTextEdit } from '@nodegui/nodegui'
import * as IlCookCircuit from './ilCookCircuitScraper.js'
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supaBaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supaBaseKey)

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

// //Select Download Folder ROw
// const downloadSelectRow = new QWidget();
// const downloadSelectRowLayout = new FlexLayout();
// downloadSelectRow.setObjectName('downloadSelectRow')
// downloadSelectRow.setLayout(downloadSelectRowLayout)

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


//Form columns?

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

// const stopButton = new QPushButton();
// stopButton.setText('Stop');
// stopButton.setObjectName('stopButton');

const downloadButton = new QPushButton();
downloadButton.setText('Download');
downloadButton.setObjectName('downloadButton');

const clearDbButton = new QPushButton();
clearDbButton.setText('Clear Database');
clearDbButton.setObjectName('clearDbButton');

//Add widgets to their respective layouts
fieldsetLayout.addWidget(caseNumRow);
buttonRowLayout.addWidget(startButton);
//buttonRowLayout.addWidget(stopButton);
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

//Scrape IL Cook Circuit docket using timeout loop
let timeoutId

function timeoutLoop(curr, stop, year, div) {
    timeoutId = setTimeout(async function scrape() {
        if (curr <= stop) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')
            let currCase = [year, div, curr]
            let caseNumStr = IlCookCircuit.formatCaseNum(currCase)
            progressTracker.setPlainText(`Currently scraping: ${caseNumStr}`)
            let succesSearch = await IlCookCircuit.searchCaseNum(browser, page, currCase[1], caseNumStr)
            console.log('found case?', succesSearch)
            await page.screenshot({path: `${currCase.join('')}.png`, fullPage: true})
            
            if (succesSearch) {
                IlCookCircuit.scrapeToDb(page, caseNumStr, div, progressTracker)
            } else if (!succesSearch) {
                console.error('No case found')
            }
            await browser.close()
            curr++
            timeoutId = setTimeout(scrape, 0)
        } else {
            console.log('run clear timeout')
            clearTimeout(timeoutId)
        }
    }, 0)
    
}

//Event handling
startButton.addEventListener('clicked', async function() {
    if (selectedDocket === 1) {
        let startSeq = Number(startSeqInput.text())
        const endSeq = Number(endSeqInput.text())
        const year = yearInput.text();
        const div = divInput.text();
        // timeoutLoop(startSeq, endSeq, year, div)
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')

        for (let i = startSeq; i <= endSeq; i++) {
            const caseNumStr = IlCookCircuit.formatCaseNum([year, div, i])
            progressTracker.setPlainText(`Searching case: ${caseNumStr}`)
            const caseFound = await IlCookCircuit.searchCaseNum(browser, page, div, caseNumStr)
            //console.log(caseFound)
            if (caseFound) { 
                //const caseHistory = await scrapeCaseActivity(browser, page)
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
        //await IlCookCircuit.scrape(startSeq, endSeq, year, div, progressTracker)

        fileDialog.setFileMode(FileMode.Directory)        
        fileDialog.exec()
        const location = fileDialog.selectedFiles();
        const fileName = fileNameInput.text();

        if (fileDialog.result() == 1 && fileName.length > 0) {
            IlCookCircuit.downloadCsv(`${location}\\${fileName}.csv`)
        } else {
            errorMessage.showMessage('Please enter a file name.')
        }

    } else if (selectedDocket === 0) {
        errorMessage.showMessage('Select a docket to scrape from.')
    }
})

/*
stopButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //check if scraper running
        //clearInterval(intervalId);
        console.log(timeoutId)
        clearTimeout(timeoutId)
        console.log(timeoutId)
        console.log('stopitgodplswork')
    } else {
        console.log('nothing to do I guess')
    }
})
*/

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