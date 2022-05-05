// Focus div based on nav button click
function detectButton(button) {
    document.getElementById('home').setAttribute("class","hidden")
    document.getElementById('single').setAttribute("class","hidden")
    document.getElementById('multi').setAttribute("class","hidden")
    document.getElementById('guess').setAttribute("class","hidden")
    document.getElementById(button).setAttribute("class","active")
}
// Flip one coin and show coin image to match result when button clicked

// Flip multiple coins and show coin images in table as well as summary results
// Enter number and press button to activate coin flip series

// Guess a flip by clicking either heads or tails button
