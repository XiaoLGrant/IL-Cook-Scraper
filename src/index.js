import { QMainWindow, QWidget, QLabel, FlexLayout, QPushButton, QLineEdit, QComboBox } from '@nodegui/nodegui'

const win = new QMainWindow();
win.setWindowTitle('Docket Scraper');
win.resize(400, 200)

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
    } else if (index === 1) {
        caseNumRow.setHidden(false);
    }
})

//Case Number Input Fields
const caseNumRow = new QWidget();
const caseNumRowLayout = new FlexLayout();
caseNumRow.setObjectName('caseNumRow');
caseNumRow.setLayout(caseNumRowLayout)

const startCaseNumLabel = new QLabel();
startCaseNumLabel.setText('Input Start Case Number')
caseNumRowLayout.addWidget(startCaseNumLabel)

const startCaseNumInput = new QLineEdit();
startCaseNumInput.setObjectName('startCaseNumInput')
caseNumRowLayout.addWidget(startCaseNumInput)

const endCaseNumLabel = new QLabel();
endCaseNumLabel.setText('Input End Case Number')
caseNumRowLayout.addWidget(endCaseNumLabel)

const endCaseNumInput = new QLineEdit();
endCaseNumInput.setObjectName('endCaseNumInput')
caseNumRowLayout.addWidget(endCaseNumInput)

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

const deleteButton = new QPushButton();
deleteButton.setText('Delete');
deleteButton.setObjectName('deleteButton');

//Add widgets to their respective layouts
fieldsetLayout.addWidget(caseNumRow);
buttonRowLayout.addWidget(startButton);
buttonRowLayout.addWidget(stopButton);
buttonRowLayout.addWidget(downloadButton);
buttonRowLayout.addWidget(deleteButton);
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
    #caseNumRow, #buttonRow {
        flex-direction: column;
    }
    #caseNumRow {
        margin-bottom: 5px;
    }
    #startCaseNumInput, #endCaseNumInput {
        width: 200px;
        margin-left: 2px;
    }
    #buttonRow{
        margin-bottom: 5px;
        flex-direction: row;
    }
    #startButton{
        width: 80px;
        margin-right: 3px;
    }
    #stopButton{
        width: 80px;
        margin-right: 3px;
    }
    #downloadButton{
        width: 80px;
        margin-right: 3px;
    }
    #deleteButton{
        width: 80px;
    }
`
rootView.setStyleSheet(rootStyleSheet);

win.setCentralWidget(rootView);
win.show();

global.win = win;