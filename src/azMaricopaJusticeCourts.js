import * as dotenv from 'dotenv'
dotenv.config()
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supaBaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supaBaseKey)

//Sleep function to avoid spamming client with requests
export const sleep = ms => new Promise(res => setTimeout(res, ms))

//Navigate to docket & wait for page to load
export async function navigateToPage(browser, page, url){
    try {
        let status = await page.goto(url);
        status = status.status();
        if (status != 404) {
            await page.waitForSelector('#MainContent_SearchByCase');
        } else {
            console.log('404 error')
        }
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

//Format case number as DDYYYYSSSSSS (division, year, sequence)
export function formatCaseNum(caseNum){
    const seqStr = addLeadingZeroes(caseNum[2])
    return ('' + caseNum[1]) + ('' + caseNum[0]) + seqStr
}

//Parse case num for division, then search the case num
export async function searchCaseNum(browser, page, div, caseNumStr) {
    try {        
        //Input case number on the docket site
        const caseNumField = await page.waitForSelector('#MainContent_caseNumber');
        await caseNumField.click({clickCount: 3});
        await caseNumField.press('Backspace'); 
        await caseNumField.type(`${caseNumStr}`);
        await sleep(Math.random() * (3000 - 1000 + 1) + 1000);
        //Search the case number
        const navigate = await Promise.all([
            page.click('#CaseSearchlink'),
            page.waitForNavigation({waitfor: 'networkidle0'})
        ]);
        await page.screenshot({path: `currentCase.png`, fullPage: true});

        //Check if the case was found on the docket and if it is sealed
        const checkCaseSealed = await page.$('#MainContent_CaseIsSealedAlert');
        const checkCaseFound = await page.$('#MainContent_CaseNotFoundAlert');
        if (checkCaseSealed !== null || checkCaseFound !== null) {
            return false;
        } else {
            return navigate[1].ok();
        }
    } catch(err) {
        console.error('Failed to search case number due to error: ', err);
    };
};

//Scrape all Events data from docket, then check if any case activity is related to proofs
export async function scrapeEvents(browser, page) {
    try {
        const caseData = await page.evaluate(() => {
            const rows = document.querySelectorAll('.jc-events .jc-case-events');
            return Array.from(rows, row => {
                const columns = row.querySelectorAll('.jc-t-data');
                return Array.from(columns, column => column.innerText.trim())
            })
        });
        
        //Store info from caseData that only contains proof-related case activity information
        let eventInfo = {'proofFiled': false, 'eventResult': null, 'eventResultDate': null}
        for (let i = 0; i < caseData.length; i++) {
            if (caseData[i][0] === "Affidavit of Service") { //change to regex later?
                eventInfo['eventResult'] = caseData[i][2]
                eventInfo['eventResultDate'] = caseData[i][3]
                eventInfo['proofFiled'] = true
                break;
            }
        }
        return eventInfo
    } catch (err) {
        console.error('Failed to search for proof-related case activity due to error: ', err)
    }
}

//Select all data from IL Cook Circuit Cases table, then save a local csv
export async function downloadCsv(url){
    try {
        const {data, error} = await supabase.from('az_maricopa_justice_courts_cases').select().csv()
        if (error) {
            console.log(error)
        }
        fs.writeFile(url, data, (err) => {
            if (err) {
                console.log(err)
            }
        })
    } catch (err) {
        console.error('Failed to download database info as csv due to error: ', err)
    }
}

export async function deleteAllData(){
    try {
        const { error } = await supabase.from('az_maricopa_justice_courts_cases').delete().gt('id', 0)
        if (error) {
            console.log('Failed to delete data from the database: ', error)
        } else {
            console.log('All data from db deleted')
        }
    } catch (err) {
        console.error('Failed to select and delete data from the database due to error: ', err)
    }
}

export async function scrapeDocket(browser, page, div){
    try {
        const caseInfo =  await page.$$eval('#MainContent_ContentPanel', (elements) => elements.map(e => ([
            ["caseNum", e.querySelector('.jc-case-information .span3-4').innerText],
            ["dateFiled", e.querySelector('.jc-case-information .jc-case-info-wrap:nth-child(2) .span3-4').innerText],
            ["caseType", e.querySelector('.jc-case-information .row:nth-child(3) .jc-case-info-wrap .span3-4').innerText],
            ["plaintiff", e.querySelector('.jc-party-information .jc-case-party-info .span3-4').innerText.trim()],
            ["attorney", e.querySelector('.jc-party-information .jc-case-info-wrap:nth-child(3) .jc-case-info-col:nth-child(2) .span3-4').innerText.trim()],
            ["calendarEvent", e.querySelector('.jc-case-event').innerText.trim()]
        ])))

        const proofInfo = await scrapeEvents(browser, page)
    
        const objectCaseInfo = Object.fromEntries(caseInfo.flat(1)) //new data to be added

        const { data, error } = await supabase.from('az_maricopa_justice_courts_cases').insert([
            { state: 'AZ',
            county: 'Maricopa',
            division: div,
            case_num: objectCaseInfo.caseNum,
            date_filed: objectCaseInfo.dateFiled,
            case_type: objectCaseInfo.caseType,
            plaintiff: objectCaseInfo.plaintiff,
            attorney: objectCaseInfo.attorney,
            calendar_event: objectCaseInfo.calendarEvent,
            proof_filed: proofInfo.proofFiled,
            proof_result: proofInfo.eventResult,
            proof_result_date: proofInfo.eventResultDate }
        ])
        if (error) {
            console.log('supabase error:', error)
        }
        await sleep(Math.random() * (10000 - 5000 + 1) + 5000)
    } catch(err) {
        console.error('Failed to scrape case data due to error: ', err)
    }
}