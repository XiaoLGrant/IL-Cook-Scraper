import * as dotenv from 'dotenv'
dotenv.config()
//const fs = require('fs')
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supaBaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supaBaseKey)


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
async function searchCaseNum(browser, page, caseNum) { //caseNum is in format of [yyyy, div, seq]
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

    await navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')

    //Loop through each case number, search the case number, scrape needed data from the docket, and save it to the cases variable
    for (let i = startSeq; i <= endSeq; i++) {
        let currCase = [year, div, i]

        await searchCaseNum(browser, page, currCase)
        await page.waitForSelector('#MainContent_pnlDetails')

        const caseHistory = await scrapeCaseActivity(browser, page)
        
        const caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ([
            ["caseNum", e.querySelector('#MainContent_lblCaseNumber').innerText],
            ["dateFiled", e.querySelector('#MainContent_lblDateFiled').innerText],
            ["caseType", e.querySelector('#MainContent_lblCaseType').innerText],
            ["plaintiff", e.querySelector('#MainContent_lblPlaintiffs').innerText.trim()],
            ["attorney", e.querySelector('#MainContent_lblAttorney').innerText.trim()]
        ])))

        const objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added
        console.log('case info pulled')
        
        //if no proof-related case activity, push case info only. Otherwise, push case info and activity info for each activity.
        if (Object.keys(caseHistory).length === 0 && caseHistory.constructor === Object) {
            const { data, error } = await supabase.from('il_cook_circuit_cases').insert([
                { case_num: objectCaseInfo.caseNum,
                date_filed: objectCaseInfo.dateFiled,
                case_type: objectCaseInfo.caseType,
                plaintiff: objectCaseInfo.plaintiff,
                attorney: objectCaseInfo.attorney}
            ])
            console.log('add w/o case activity')
        } else {
            for (let activity in caseHistory) {
                const { data, error } = await supabase.from('il_cook_circuit_cases').insert([
                    { case_num: objectCaseInfo.caseNum,
                    date_filed: objectCaseInfo.dateFiled,
                    case_type: objectCaseInfo.caseType,
                    plaintiff: objectCaseInfo.plaintiff,
                    attorney: objectCaseInfo.attorney,
                    act_date: caseHistory[activity]['actDate'],
                    event_des: caseHistory[activity]['eventDesc'],
                    comments: caseHistory[activity]['comments']}
                ])
            }
        }
        
        await Promise.all([
            page.click('#MainContent_btnSearch2'),
            page.waitForNavigation({waitfor: 'networkidle0'})
        ])
       
    }
    
    await browser.close();
}

scrape(2022, 'L', '000001', '000010');