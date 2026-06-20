async function run() {
  const q = encodeURIComponent('محمد');
  try {
    const res = await fetch('https://shamela.ws/search?q='+q);
    const text = await res.text();
    console.log('Shamela HTML length:', text.length);
    const matches = [...text.matchAll(/<a[^>]*href="\/book\/(\d+)"[^>]*>(.*?)<\/a>/g)];
    if (matches.length > 0) {
      console.log('Found Shamela matches:', matches.slice(0, 3).map(m => m[2].replace(/<[^>]+>/g, '')));
    } else {
      console.log('No matches');
    }
  } catch(e) {
    console.log(e);
  }
}
run();
