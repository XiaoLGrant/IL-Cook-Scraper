import * as dotenv from 'dotenv'
dotenv.config()
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = process.env.SUPABASE_URL
const supaBaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supaBaseKey)

//Sleep function to avoid spamming client with requests
export const sleep = ms => new Promise(res => setTimeout(res, ms))

//Navigate to & wait for page to load
export async function navigateToPage(browser, page, url){
    try {
        let status = await page.goto(url);
        status = status.status();
        if (status != 404) {
            await page.waitForSelector('.accountMembers');
        } else {
            console.log('404 error')
        }
    } catch (err) {
        console.error('Failed to navigate to page due to error: ', err);
    }
}

//Scrape all names from page
export async function scrapeNames(browser, page) {
    try {
        const caseData = await page.evaluate(() => {
            const rows = document.querySelectorAll('[data-content="Name"]');
            return Array.from(rows, row => row.innerText)
        });
        return caseData
    } catch (err) {
        console.error('Failed to scrape user names due to error: ', err)
    }
}

//In future: save names to Supabase for export as .csv file OR save as JSON file
export async function scrapeDocket(browser, page){
    try {
        const names = await scrapeNames(browser, page)
        if (error) {
            console.log('scraping error:', error)
        }
    } catch(err) {
        console.error('Failed to scrape case data due to error: ', err)
    }
}