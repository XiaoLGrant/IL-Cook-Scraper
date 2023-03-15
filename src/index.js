import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox } from '@nodegui/nodegui'
import * as IlCookCircuit from './ilCookCircuitScraper.js'

let selectedDocket = 0
let cancelled = false

const win = new QMainWindow();
win.setWindowTitle('Docket Scraper');
win.resize(400, 250)

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
yearLabel.setText('Year')
yearDivRowLayout.addWidget(yearLabel)

const yearInput = new QLineEdit();
yearInput.setObjectName('yearInput')
yearDivRowLayout.addWidget(yearInput)

const divLabel = new QLabel();
divLabel.setText('Division')
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
startSeqLabel.setText('Starting Sequence')
seqRowLayout.addWidget(startSeqLabel)

const startSeqInput = new QLineEdit();
startSeqInput.setObjectName('startSeqInput')
seqRowLayout.addWidget(startSeqInput)

const endSeqLabel = new QLabel();
endSeqLabel.setText('Ending Sequence')
seqRowLayout.addWidget(endSeqLabel)

const endSeqInput = new QLineEdit();
endSeqInput.setObjectName('endSeqInput')
seqRowLayout.addWidget(endSeqInput)

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
startButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        // const year = yearInput.text();
        // const div = divInput.text();
        // const startSeq = startSeqInput.text();
        // const endSeq = endSeqInput.text();
        // IlCookCircuit.scrape(year, div, startSeq, endSeq)

        for (let i = 0; i < 20000; i++) {
            if (cancelled) {
                return
            }
            console.log(i)
        }
    } else if (selectedDocket === 0) {
        console.log('button clicked')
    }
})

stopButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //check if scraper running
        clearInterval(timeValue);
    } else {
        console.log('nothing to do I guess')
    }
})

downloadButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        IlCookCircuit.downloadCsv()
    } else {
        console.log('Select a docket')
    }
})

clearDbButton.addEventListener('clicked', () => {
    if (selectedDocket === 1) {
        //throw popup to confirm
        IlCookCircuit.deleteAllData()
    } else {
        console.log('Nothing to delete i guess')
    }
})

win.setCentralWidget(rootView);
win.show();

global.win = win;