
async function getUserData(){
    const response = await fetch('/api/users');
    return response.json();
}

function loadTable(users){
    const table = document.querySelector('#result');
    for(let user of users){
        let tr=document.createElement('tr');
        let td1=document.createElement('td'), td2=document.createElement('td');
        td1.innerText=user.id;
        td2.innerText=user.username;
        tr.append(td1,td2);
        table.append(tr);
    }
}

async function main(){
    const users = await getUserData();
    loadTable(users);
}

$(document).ready(function () {
    $('#clientTable').DataTable();
  });
  

let sidebar = document.querySelector(".sidebar");
let sidebarBtn = document.querySelector(".sidebarBtn");
sidebarBtn.onclick = function () {
  sidebar.classList.toggle("active");
  if (sidebar.classList.contains("active")) {
    sidebarBtn.classList.replace("bx-menu", "bx-menu-alt-right");
  } else sidebarBtn.classList.replace("bx-menu-alt-right", "bx-menu");
};


main();