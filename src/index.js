import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox, QFileDialog, FileMode, QErrorMessage } from '@nodegui/nodegui'
import * as IlCookCircuit from './ilCookCircuitScraper.js'
import puppeteer from 'puppeteer'

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

//Button row
const buttonRow =  new QWidget();
const buttonRowLayout = new FlexLayout();
buttonRow.setObjectName('buttonRow');
buttonRow.setLayout(buttonRowLayout);

//Buttons
const startButton = new QPushButton();
startButton.setText('Start');
startButton.setObjectName('startButton');

const stopButton = new QPushButton();
stopButton.setText('Stop');
stopButton.setObjectName('stopButton');

const downloadButton = new QPushButton();
downloadButton.setText('Download');
downloadButton.setObjectName('downloadButton');

const clearDbButton = new QPushButton();
clearDbButton.setText('Clear Database');
clearDbButton.setObjectName('clearDbButton');

//Add widgets to their respective layouts
fieldsetLayout.addWidget(caseNumRow);
buttonRowLayout.addWidget(startButton);
buttonRowLayout.addWidget(stopButton);
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
    #buttonRow{
        margin-bottom: 5px;
        flex-direction: row;
    }
`
rootView.setStyleSheet(rootStyleSheet);


//Event handling
//let intervalId
let timeoutId
let counter = 0
let stopNum = 5
function intervalLoop(counter, stopNum) {
    intervalId = setInterval(() => {
        if (counter <= stopNum) {
            console.log(counter)
            counter++
        } else {
            return
        }
    }, 2000)
}

function scrapeTimeoutTest() {
    return new Promise((res, rej) => function() {
        cancelToken.cancel = function() {
            rej(new Error('scrapeTimeoutTest() cancelled'))
        }
        setTimeout(function scrape() {
            console.log('do scraping things')
        }, 1000)
    })
}

function beginTest(curr, stop, year, div) {

    timeoutId = setTimeout(async function scrape() {
        if (curr <= stop) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')
            let currCase = [year, div, curr]
            await IlCookCircuit.searchCaseNum(browser, page, currCase)
            await page.screenshot({path: `${currCase.join('')}.png`, fullPage: true})
            await browser.close();
            //console.log(curr)
            curr++
            timeoutId = setTimeout(scrape, 0)
        } else {
            console.log('run clear timeout')
            clearTimeout(timeoutId)
        }
        
    }, 0)
    
}

function timeoutLoop(curr, stop, year, div) {

    timeoutId = setTimeout(async function scrape() {
        if (curr <= stop) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await IlCookCircuit.navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')
            let currCase = [year, div, curr]
            await IlCookCircuit.searchCaseNum(browser, page, currCase)
            await page.screenshot({path: `${currCase.join('')}.png`, fullPage: true})
            await browser.close();
            //console.log(curr)
            curr++
            timeoutId = setTimeout(scrape, 0)
        } else {
            console.log('run clear timeout')
            clearTimeout(timeoutId)
        }
        
    }, 0)
    
}

startButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        // const year = yearInput.text();
        // const div = divInput.text();
        // const startSeq = startSeqInput.text();
        // const endSeq = endSeqInput.text();
        //if (year.length === 4 && div.length === 1 && startSeq.length === 6 && endSeq.length === 6) {
            // IlCookCircuit.scrape(year, div, startSeq, endSeq)
        //} else {
        //     errorMessage.showMessage('The case numbers entered are not valid.')
        // }
        

        //loop(counter, stopNum)
        let startSeq = Number(startSeqInput.text())
        const endSeq = Number(endSeqInput.text())
        const year = yearInput.text();
        const div = divInput.text();
        timeoutLoop(startSeq, endSeq, year, div)
    } else if (selectedDocket === 0) {
        errorMessage.showMessage('Select a docket to scrape from.')
    }
})

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

downloadButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        fileDialog.setFileMode(FileMode.Directory)        
        fileDialog.exec()
        const location = fileDialog.selectedFiles();
        const fileName = fileNameInput.text();

        if (fileDialog.result() == 1 && fileName.length > 0) {
            IlCookCircuit.downloadCsv(`${location}\\${fileName}.csv`)
        } else {
            console.log('location not selected or conditional is not working right')
        }
        
    } else {
        errorMessage.showMessage('Select a docket to download from.')
    }
})

clearDbButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //throw popup to confirm
        IlCookCircuit.deleteAllData()
    } else {
        errorMessage.showMessage('Select a docket delete data from.')
    }
})

win.setCentralWidget(rootView);
win.show();

global.win = win;