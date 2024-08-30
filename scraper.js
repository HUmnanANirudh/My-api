const puppeteer = require('puppeteer');

async function scrapeAmazon(query, maxPages = 5) {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    const products = [];

    try {
        for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
            console.log(`Scraping page ${currentPage}...`);

            // Navigate to the current page
            await page.goto(`https://www.amazon.in/s?k=${query}&page=${currentPage}`, { waitUntil: 'networkidle2' });


            // Extract product data
            const pageProducts = await page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.s-main-slot .s-result-item'));
                console.log(`Found ${items.length} items on page`);
                return items.map(item => {
                    const titleElement = item.querySelector('h2');
                    const priceElement = item.querySelector('.a-price-whole');
                    const imageElement = item.querySelector('.s-image');
                    const linkElement = titleElement ? titleElement.querySelector('a') : null;

                    const title = titleElement ? titleElement.innerText : null;
                    const price = priceElement ? priceElement.innerText : null;
                    const image = imageElement ? imageElement.src : null;
                    const link = linkElement ? `https://www.amazon.in${linkElement.getAttribute('href')}` : null;

                    return title && price && image ? { title, price, image, link } : null;
                }).filter(product => product !== null); // Filter out null values
            });

            console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
            products.push(...pageProducts);

            // Delay for 2 seconds before scraping the next page
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    } catch (error) {
        console.error('Error during scraping:', error);
    } finally {
        await browser.close();
    }

    return products;
}

async function scrapeProductDescription(productUrl) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    let description = '';

    try {
        await page.goto(productUrl, { waitUntil: 'networkidle2' });

        // Extract product description
        description = await page.evaluate(() => {
            const descElement = document.getElementById('productDescription') || document.querySelector('#feature-bullets ul');
            return descElement ? descElement.innerText : 'No description available';
        });
    } catch (error) {
        console.error('Error fetching product description:', error);
    } finally {
        await browser.close();
    }

    return description;
}

module.exports = { scrapeAmazon, scrapeProductDescription };
