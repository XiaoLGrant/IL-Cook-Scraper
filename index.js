const fs = require('fs')
const puppeteer = require('puppeteer')
const dfd = require('danfojs-node')

//Navigate to docket & wait for page to load
async function navigateToPage(browser, page, url){
    await page.goto(url)
    await page.waitForSelector('#MainContent_ddlDatabase')
}

//Convert a sequence into six digits by adding preceding zeroes
function addLeadingZeroes(seq){
    const length = ('' + seq).length
    if (length < 6) {
        let stringSeq = ''
        const numPrecedingZeroes = 6 - length
        stringSeq = '0'.repeat(numPrecedingZeroes)
        stringSeq += seq
        return stringSeq
    } else {
        return '' + seq
    }
}

//Parse case num for division, then search the case num
async function searchCaseNum(browser, page, caseNum) { //casenum is in format of [yyyy, div, seq]
    const division = caseNum[1] === 'L' ? '2' : '1'
    const seqStr = addLeadingZeroes(caseNum[2])
    const caseNumStr = caseNum[0] + caseNum[1] + seqStr
    console.log(caseNumStr)
    await page.select('#MainContent_ddlDatabase', division)

    const caseNumField = await page.waitForSelector('#MainContent_txtCaseNumber');
    await caseNumField.type(`${caseNumStr}`)
    await page.screenshot({path: 'example.png', fullPage: true})
    await Promise.all([
        page.click('#MainContent_btnSearch'),
        page.waitForNavigation({waitfor: 'networkidle0'})
    ])
}

//Scrape all table data from docket, then check if any case activity is related to proofs
async function scrapeCaseActivity(browser, page) {
    const caseData = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns, column => column.innerText.trim())
        })
    });
    
    //Store info from caseData that only contains proof-related case activity information
    let activityInfo = {}
    for (let i = 0; i < caseData.length; i++) {
        if (caseData[i][0] === "Activity Date:" && caseData[i][3].toLowerCase().includes('serv')) { //change to regex later to remove need to convert to lowercase first
            activityInfo[i] = {
                "actDate": caseData[i][1],
                "eventDesc": caseData[i][3],
                "comments": caseData[i][5]
            }
        }
    }
    return activityInfo
}

async function scrape(year, div, start, end) { //start & end are seq from case num
    const browser = await puppeteer.launch(); //launches browser, allows to fire events, etc.
    const page = await browser.newPage();
    const startSeq = Number(start)
    const endSeq = Number(end)
    let cases = {}

    await navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')

    //Loop through each case number, search the case number, scrape needed data from the docket, and save it to the cases variable
    for (let i = startSeq; i <= endSeq; i++) {
        let currCase = [year, div, i]
        // let data = fs.readFileSync("cases.json")
        // let dataObj = JSON.parse(data)

        const streamCases = fs.createWriteStream('streamCases.json', {flags: 'a'})

        await searchCaseNum(browser, page, currCase)
        await page.waitForSelector('#MainContent_pnlDetails')

        const caseHistory = await scrapeCaseActivity(browser, page)

        // let caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ({
        //     caseNum: e.querySelector('#MainContent_lblCaseNumber').innerText,
        //     dateFiled: e.querySelector('#MainContent_lblDateFiled').innerText,
        //     caseType: e.querySelector('#MainContent_lblCaseType').innerText,
        //     plaintiff: e.querySelector('#MainContent_lblPlaintiffs').innerText,
        //     attorney: e.querySelector('#MainContent_lblAttorney').innerText.trim()
        // })))
        
        let caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ([
            ["caseNum", e.querySelector('#MainContent_lblCaseNumber').innerText],
            ["dateFiled", e.querySelector('#MainContent_lblDateFiled').innerText],
            ["caseType", e.querySelector('#MainContent_lblCaseType').innerText],
            ["plaintiff", e.querySelector('#MainContent_lblPlaintiffs').innerText],
            ["attorney", e.querySelector('#MainContent_lblAttorney').innerText.trim()]
        ])))

        let objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added
        objectCaseInfo["caseAcitvity"] = caseHistory
        //console.log(objectCaseInfo)
        cases[currCase.join('')] = objectCaseInfo
        console.log('case info pulled')
        await Promise.all([
            page.click('#MainContent_btnSearch2'),
            page.waitForNavigation({waitfor: 'networkidle0'})
        ])

         //loop through case history
            //for each case activity, append new case info object to json file
        //store JSON 

        if (!fs.existsSync('cases.json')) {
            fs.closeSync(fs.openSync('cases.json', 'w'))
        }

        //const file = fs.readFileSync('cases.json')
        const dat = {}
        dat[currCase.join('')] = objectCaseInfo
        streamCases.write(JSON.stringify(dat))
        // if (file.length == 0) {
        //     fs.writeFileSync('cases.json', JSON.stringify([dat]))
        //     console.log('file created, data added')
        // } else {
        //     let json = JSON.parse(file.toString())
        //     console.log(typeof json)
        //     json.push({dat})
        //     //json[currCase.join('')] = dat
        //     console.log(json)
        //     fs.appendFile('cases.json', JSON.stringify(json), (err) => {
        //         if (err) {
        //             console.log(err)
        //         } else {
        //             console.log('File updated')
        //         }
        //     })
        // }
        // dataObj.push(objectCaseInfo)
        // let allCaseInfo = JSON.stringify(dataObj)
        // fs.writeFile("cases2.json", allCaseInfo, (err) => {
        //     if (err) throw err;
        //     console.log('new data added')
        // })
       
    }

    // Save scraped data to JSON file
    // fs.writeFile('cases.json', JSON.stringify(cases), (err) => {
    //     if (err) throw err;
    //     console.log('File saved')
    // })
    
    await browser.close();
}

scrape(2022, 'L', '000001', '000002');

// import data from './cases.json' assert { type: 'JSON' }
// console.log(data)

//https://danfo.jsdata.org/



//navigate to search page
//for case nums x through y
    //search case num: 20223000001 (civil), 2022L000001(law)
        //take in case num, split to determine dvision
    //scrape data
    //save scraped data
    //return to search page
//output all scraped data into 1 file


    //previous code to search case num
    // await page.$eval('#MainContent_ddlDatabase', el => el.value = '2');
    // await page.waitForSelector('#MainContent_txtCaseNumber');
    // await page.$eval('#MainContent_txtCaseNumber', el => el.value = '2022L000001');
    // await Promise.all([
    //     page.click('#MainContent_btnSearch'),
    //     page.waitForNavigation({waitfor: 'networkidle0'})
    // ])


    //previous code to scrape case history for proof-related info
    /*
    //Case Acitivities: pull all content in tables
    const caseData = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tr');
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td');
            return Array.from(columns, column => column.innerText.trim())
        })
    });
    
    //await page.screenshot({path: 'example.png', fullPage: true})

    //Create new array from caseData that only contains case activity information
    let activityInfo = {}
    for (let i = 0; i < caseData.length; i++) {
    //for (let data of caseData) {
        if (caseData[i][0] === "Activity Date:" && caseData[i][3].toLowerCase().includes('serv')) { //change to regex later to remove need to conver to lowercase first
            activityInfo[i] = {
                "actDate": caseData[i][1],
                "eventDesc": caseData[i][3],
                "comments": caseData[i][5]
            }
        }
    }
    */

    //const caseActivs = await page.waitForSelector('text/Case Activities')
    // const caseNo = await page.waitForSelector('text/Case Number')
    // const caseNoText = await caseNo.evaluate(el => el.textContent)
    // const caseType = await page.waitForSelector('text/Case Type')
    // const caseTypeText = await caseType.evaluate(el => el.textContent)
    // const caseType = await page.$$eval('#MainContent_lblCaseType', (elements) => elements.map(e => ({
    //         name: e.textContent.trim()
    //     })))
    //const caseInfo = await page.evaluate(() => document.body.innerText)
    
    //const caseInfo = await page.$eval('#MainContent_pnlDetails', el => el)

    // const allTables = await page.evaluate(() => Array.from(document.querySelectorAll('#MainContent_pnlDetails tbody'), (e) => ({
    //     caseNum: e.querySelector('#MainContent_lblCaseNumber').value
    // })))
    // const firstTable = await allTables[0]
    // const caseDetails = await page.evaluate(() => Array.from(document.querySelectorAll('table #MainContent_lblCaseNumber'), (e) => ({

    // })))

    // const caseData2 = await page.evaluate(() => {
    //     const rows = document.querySelectorAll('')
    // })

    //const html = await page.content();
    //const text = await page.evaluate(() => document.body.innerText)
    // const options = await page.evaluate(() => Array.from(document.querySelectorAll('#MainContent_ddlDatabase option'), (e) => ({
    //    name: e.textContent,
    //    value: e.value
    // })))

    // const divisions = await page.$$eval('#MainContent_ddlDatabase option', (elements) => elements.map(e => ({
    //     name: e.textContent.trim(),
    //     value: e.value
    // })))
    //console.log(divisions)