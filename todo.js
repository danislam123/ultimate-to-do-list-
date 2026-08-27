const taskInput=document.getElementById("taskInput");
const categoryInput=document.getElementById("categoryInput");
const deadlineInput=document.getElementById("deadlineInput");
const addTaskBtn=document.getElementById("addTaskBtn");
const taskList=document.getElementById("taskList");
const taskCount=document.getElementById("taskCount");
const xpText=document.getElementById("xpText");
const levelText=document.getElementById("levelText");
const xpBar=document.getElementById("xpBar");
const achievementText=document.getElementById("achievementText");
const randomBtn=document.getElementById("randomBtn");

let xp=0;
let level=1;
let completedTasks=0;

function addTask(){
    const taskText=taskInput.value.trim();
    if(taskText==="")return;

    const category=categoryInput.value;
    const deadline=deadlineInput.value;

    const li=document.createElement("li");
    li.classList.add("task-item");

    saveTaskToServer(taskText).then(savedTodo => {
    li.dataset.todoId = savedTodo.todo_id; // remember its DB id for later updates/deletes
});

    const categorySpan=document.createElement("span");
    categorySpan.textContent=category;
    categorySpan.classList.add("task-category");

    const span=document.createElement("span");
    span.textContent=taskText;
    span.classList.add("task-text");

    const deadlineSpan=document.createElement("span");
    deadlineSpan.classList.add("task-deadline");

    if(deadline!==""){
        const date=new Date(deadline);
        deadlineSpan.textContent="Deadline: "+date.toLocaleString();
        li.dataset.deadline=deadline;
    }else{
        deadlineSpan.textContent="No deadline";
    }

    const completeBtn=document.createElement("button");
    completeBtn.textContent="Complete";
    completeBtn.classList.add("complete-btn");

    completeBtn.addEventListener("click",function(){
    const todoId = li.dataset.todoId;
    if(!span.classList.contains("completed")){
        span.classList.add("completed");
        completeBtn.textContent="Completed";
        li.classList.add("completed-task");
        completedTasks++;
        addXP(10);
        updateAchievements();
        updateTaskCount();
        updateTaskOnServer(todoId, true); // <-- add this
    }else{
        span.classList.remove("completed");
        completeBtn.textContent="Complete";
        li.classList.remove("completed-task");
        completedTasks--;
        addXP(-10);
        updateAchievements();
        updateTaskCount();
        updateTaskOnServer(todoId, false); // <-- add this
    }
});


    const deleteBtn=document.createElement("button");
    deleteBtn.textContent="Delete";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click",function(){
        if(span.classList.contains("completed")){
            completedTasks--;
        }

        li.remove();
        updateTaskCount();
        updateAchievements();
    });

    li.appendChild(categorySpan);
    li.appendChild(span);
    li.appendChild(deadlineSpan);
    li.appendChild(completeBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);

    taskInput.value="";
    deadlineInput.value="";

    updateTaskCount();
    updateAchievements();
}

function updateTaskCount(){
    taskCount.textContent="Tasks: "+taskList.children.length;
}

function addXP(amount){
    xp+=amount;

    if(xp<0){
        xp=0;
    }

    while(xp>=100){
        xp-=100;
        level++;
        showLevelUp();
    }

    updateXP();
}

function updateXP(){
    levelText.textContent="Level "+level;
    xpText.textContent=xp+" / 100 XP";
    xpBar.style.width=xp+"%";
}

function showLevelUp(){
    const popup=document.createElement("div");
    popup.className="level-popup";
    popup.textContent="LEVEL UP";
    document.body.appendChild(popup);

    setTimeout(function(){
        popup.remove();
    },2000);
}

function updateAchievements(){
    let achievement="No achievements yet";

    if(completedTasks>=1){
        achievement="First Step";
    }

    if(completedTasks>=5){
        achievement="Getting Started";
    }

    if(completedTasks>=10){
        achievement="Task Hunter";
    }

    if(completedTasks>=25){
        achievement="Task Master";
    }

    if(completedTasks>=50){
        achievement="Productivity Legend";
    }

    achievementText.textContent=achievement;
}

function chooseRandomTask(){
    const tasks=[...taskList.children].filter(function(task){
        return !task.querySelector(".task-text").classList.contains("completed");
    });

    if(tasks.length===0){
        alert("No unfinished tasks.");
        return;
    }

    const randomTask=tasks[Math.floor(Math.random()*tasks.length)];

    taskList.querySelectorAll(".selected-task").forEach(function(task){
        task.classList.remove("selected-task");
    });

    randomTask.classList.add("selected-task");

    randomTask.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });
}
addTaskBtn.addEventListener("click",addTask);

taskInput.addEventListener("keydown",function(event){
    if(event.key==="Enter"){
        event.preventDefault();
        addTask();
    }
});

randomBtn.addEventListener("click",chooseRandomTask);

updateXP();
updateTaskCount();
updateAchievements();

const API_URL = "http://127.0.0.1:8000/todos";

async function loadTodos() {
  const res = await fetch(API_URL);
  const todos = await res.json();

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.classList.add("task-item");
    li.dataset.todoId = todo.todo_id;

    const span = document.createElement("span");
    span.textContent = todo.todo_name;
    span.classList.add("task-text");

    const completeBtn = document.createElement("button");
    completeBtn.textContent = todo.is_completed ? "Completed" : "Complete";
    completeBtn.classList.add("complete-btn");

    if (todo.is_completed) {
      span.classList.add("completed");
      li.classList.add("completed-task");
    }

    completeBtn.addEventListener("click", function () {
      const nowCompleted = !span.classList.contains("completed");
      span.classList.toggle("completed");
      li.classList.toggle("completed-task");
      completeBtn.textContent = nowCompleted ? "Completed" : "Complete";
      updateTaskOnServer(todo.todo_id, nowCompleted);
      updateTaskCount();
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-btn");

    deleteBtn.addEventListener("click", function () {
      li.remove();
      updateTaskCount();
    });

    li.appendChild(span);
    li.appendChild(completeBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
  });

  updateTaskCount();
}

window.onload = loadTodos;
async function saveTaskToServer(taskText) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ todo_name: taskText })
  });
  return res.json(); // returns the saved todo, including its todo_id
}

async function updateTaskOnServer(todoId, isCompleted) {
  await fetch(`${API_URL}/${todoId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_completed: isCompleted })
  });
}

