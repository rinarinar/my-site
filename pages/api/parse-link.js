export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 5000,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();

    // 解析图片: 尝试 og:image 或是商品图常用 class/id
    let image = '';
    const ogImageMatch = text.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i) || 
                         text.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"/i);
    if (ogImageMatch) {
      image = ogImageMatch[1];
    } else {
      // 一些电商图 fallback
      const imgMatch = text.match(/<img[^>]*id="(landingImage|J_ImgBooth)"[^>]*src="([^"]+)"/i) ||
                       text.match(/<img[^>]*class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/i);
      if (imgMatch) {
        image = imgMatch[2] || imgMatch[1];
      }
    }
    if (image && image.startsWith('//')) {
      image = 'https:' + image;
    }

    // 解析价格: 尝试 og:price:amount 或 json-ld 中的 price 或简单的 DOM regex
    let price = '';
    const ogPriceMatch = text.match(/<meta[^>]*property="og:price:amount"[^>]*content="([^"]+)"/i);
    if (ogPriceMatch) {
      price = ogPriceMatch[1];
    } else {
      const priceRegexMatch = text.match(/"price"\s*:\s*"?(\d+(\.\d{1,2})?)"?/i) || 
                              text.match(/<span[^>]*class="[^"]*price[^"]*"[^>]*>[^\d]*(\d+(\.\d+)?)/i);
      if (priceRegexMatch) {
        price = priceRegexMatch[1];
      }
    }

    // 解析季节: 粗略猜测
    let season = [];
    if (text.match(/夏|summer|短袖|凉鞋/i)) season.push('夏');
    if (text.match(/冬|winter|羽绒|棉服|雪地/i)) season.push('冬');
    if (text.match(/春|spring|薄款外套/i)) season.push('春');
    if (text.match(/秋|autumn|fall|毛衣|风衣/i)) season.push('秋');
    
    if (season.length === 0) season = ['四季'];

    res.status(200).json({ image, price, season });
  } catch (e) {
    console.error('Parse link error:', e);
    // 即使解析失败，也不要让请求直接挂掉，返回空结果让客户端处理
    res.status(200).json({ image: '', price: '', season: ['四季'], error: e.message });
  }
}
