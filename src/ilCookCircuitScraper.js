import * as dotenv from 'dotenv'
dotenv.config()
import fs from 'fs'
import puppeteer from 'puppeteer'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supaBaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supaBaseKey)

//Navigate to docket & wait for page to load
export async function navigateToPage(browser, page, url){
    try {
        await page.goto(url);
        await page.waitForSelector('#MainContent_ddlDatabase');
    } catch (err) {
        console.error('Failed to navigate to page due to error: ', err);
    }

}

//Convert a sequence into six digits by adding preceding zeroes
export function addLeadingZeroes(seq){
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

export function formatCaseNum(caseNum){
    const seqStr = addLeadingZeroes(caseNum[2])
    return caseNum[0] + caseNum[1] + seqStr
}

//Parse case num for division, then search the case num
export async function searchCaseNum(browser, page, div, caseNumStr) {
    try {
        const divSelections = {
            'L': '2',
            'D': '4',
        }
        const division = divSelections[div] ? divSelections[div] : '1'
        
        //Input division and sequence on the docket site
        await page.select('#MainContent_ddlDatabase', division)
        const caseNumField = await page.waitForSelector('#MainContent_txtCaseNumber');
        await caseNumField.type(`${caseNumStr}`)
        
        //Search the case number
        const navigate = await Promise.all([
            page.click('#MainContent_btnSearch'),
            page.waitForNavigation({waitfor: 'networkidle0'})
        ])
        await page.screenshot({path: `currentCase.png`, fullPage: true})

        //const nodeChildren1 = await page.$eval('#MainContent_lblErr p', el => el ? el.innerText : '');
        
        //Check if the case was found on the docket
        const checkCaseFound = await page.$$eval('#MainContent_lblErr p', el => {
            return el.map(e => e ? e.innerText : null);
        });
        console.log('caseFound?:', checkCaseFound)
        if (checkCaseFound) {//case not found
            return false
        } else {//case not found
            return navigate[1].ok()
        }
    } catch(err) {
        console.error('Failed to search case number due to error: ', err)
    }

}

//Scrape all table data from docket, then check if any case activity is related to proofs
export async function scrapeCaseActivity(browser, page) {
    try {
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
    } catch (err) {
        console.error('Failed to search for proof-related case activity due to error: ', err)
    }
}

//Select all data from IL Cook Circuit Cases table, then save a local csv
export async function downloadCsv(url){
    try {
        const {data, error} = await supabase.from('il_cook_circuit_cases2').select().csv()
        fs.writeFile(url, data, (err) => {
            if (err) {
                console.log(err)
            } else {
                console.log('csv written successfully')
            }
        })
    } catch (err) {
        console.error('Failed to download database info as csv due to error: ', err)
    }

}

export async function deleteAllData(){
    try {
        const { error } = await supabase.from('il_cook_circuit_cases2').delete().gt('id', 0)
        if (error) {
            console.log('Failed to delete data from the database: ', error)
        } else {
            console.log('All data from db deleted')
        }
    } catch (err) {
        console.error('Failed to select and delete data from the database due to error: ', err)
    }

}

export async function scrapeToDb(page, caseNum, div, progressTracker){
    try {
        const caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ([
            ["caseNum", e.querySelector('#MainContent_lblCaseNumber').innerText],
            ["dateFiled", e.querySelector('#MainContent_lblDateFiled').innerText],
            ["caseType", e.querySelector('#MainContent_lblCaseType').innerText],
            ["plaintiff", e.querySelector('#MainContent_lblPlaintiffs').innerText.trim()],
            ["attorney", e.querySelector('#MainContent_lblAttorney').innerText.trim()]
        ])))
    
        const objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added
        progressTracker.setPlainText(`Data scraped: ${caseNum}`)
        console.log('scraped')
        
        const { data, error } = await supabase.from('il_cook_circuit_cases2').insert([
            { state: 'IL',
            county: 'Cook',
            division: div,
            case_num: objectCaseInfo.caseNum,
            date_filed: objectCaseInfo.dateFiled,
            case_type: objectCaseInfo.caseType,
            plaintiff: objectCaseInfo.plaintiff,
            attorney: objectCaseInfo.attorney}
        ])
        if (!error) progressTracker.setPlainText(`Scraped data saved to db: ${caseNum}`)
        // await Promise.all([
        //     page.click('#MainContent_btnSearch2'),
        //     page.waitForNavigation({waitfor: 'networkidle0'})
        // ])
    } catch(err) {
        console.error('Could not scrape case info to database:', err)
    }

}

export async function scrapeDocket(browser, page, div){
    const caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ([
        ["caseNum", e.querySelector('#MainContent_lblCaseNumber').innerText],
        ["dateFiled", e.querySelector('#MainContent_lblDateFiled').innerText],
        ["caseType", e.querySelector('#MainContent_lblCaseType').innerText],
        ["plaintiff", e.querySelector('#MainContent_lblPlaintiffs').innerText.trim()],
        ["attorney", e.querySelector('#MainContent_lblAttorney').innerText.trim()]
    ])))

    const objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added
    
    const { data, error } = await supabase.from('il_cook_circuit_cases2').insert([
        { state: 'IL',
        county: 'Cook',
        division: div,
        case_num: objectCaseInfo.caseNum,
        date_filed: objectCaseInfo.dateFiled,
        case_type: objectCaseInfo.caseType,
        plaintiff: objectCaseInfo.plaintiff,
        attorney: objectCaseInfo.attorney}
    ])
}

export async function scrape(start, stop, year, div, progressTracker) { //start & end are seq from case num
    try {
        const browser = await puppeteer.launch(); //launches browser, allows to fire events, etc.
        const page = await browser.newPage();
        await navigateToPage(browser, page, 'https://casesearch.cookcountyclerkofcourt.org/CivilCaseSearchAPI.aspx')
    
        //Loop through each case number, search the case number, scrape needed data from the docket, and save it to the cases variable
        for (let i = start; i <= stop; i++) {
            const caseNumStr = formatCaseNum([year, div, i])
            const caseFound = await searchCaseNum(browser, page, div, caseNumStr)
            //await page.waitForSelector('#MainContent_pnlDetails') -- not sure if this one needed
            //console.log(caseFound)
            if (caseFound) { 
                //const caseHistory = await scrapeCaseActivity(browser, page)
            
                const caseInfo =  await page.$$eval('#MainContent_pnlDetails', (elements) => elements.map(e => ([
                    ["caseNum", e.querySelector('#MainContent_lblCaseNumber').innerText],
                    ["dateFiled", e.querySelector('#MainContent_lblDateFiled').innerText],
                    ["caseType", e.querySelector('#MainContent_lblCaseType').innerText],
                    ["plaintiff", e.querySelector('#MainContent_lblPlaintiffs').innerText.trim()],
                    ["attorney", e.querySelector('#MainContent_lblAttorney').innerText.trim()]
                ])))
        
                const objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added
                
                const { data, error } = await supabase.from('il_cook_circuit_cases2').insert([
                    { state: 'IL',
                    county: 'Cook',
                    division: div,
                    case_num: objectCaseInfo.caseNum,
                    date_filed: objectCaseInfo.dateFiled,
                    case_type: objectCaseInfo.caseType,
                    plaintiff: objectCaseInfo.plaintiff,
                    attorney: objectCaseInfo.attorney}
                ])
                await Promise.all([
                    page.click('#MainContent_btnSearch2'),
                    page.waitForNavigation({waitfor: 'networkidle0'})
                ])

            } else if (!caseFound) {
                progressTracker.setPlainText(`Case not found: ${caseNumStr}`)
            }
        }
        
        await browser.close();
        //downloadCsv()
        //confirm delete all data from table, then delete
        //const { error } = await supabase.from('il_cook_circuit_cases').select().delete()

    } catch(err) {
        console.error('Failed to scrape case data due to error: ', err)
    }

}


//autohot key
//node js native UI
//scrape all case data for nums x to y
//omit attorneys abc already works for
//harris county scraper works w/o having to do captcha
//30-40k cases