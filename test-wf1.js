async function main(){

const res = await fetch(
"http://localhost:5000/api/analyze",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
file_url:
"https://img.xwyue.com/i/2026/07/18/6a5b832647a4a.jpg"
})
}
);

console.log(await res.text());

}

main();