document.addEventListener('DOMContentLoaded', function() {

  console.log('Main function')

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Load sent mailbox if email has just been sent
  const load_sent_mailbox = localStorage.getItem('email_sent');

  // Decide what mailbox to load
  console.log(`Cargar sent mailbox: ${load_sent_mailbox}`);

  if (load_sent_mailbox == "true") {
    console.log(`Cargando sent mailbox. load_sent_mailbox = ${load_sent_mailbox}`);
    load_mailbox('sent');
    console.log(`Cargado sent mailbox y variable email_sent: ${localStorage.getItem('email_sent')}`);
  } else {
    console.log(`Cargando inbox. load_sent_mailbox = ${load_sent_mailbox}`);
    load_mailbox('inbox');
  }

  localStorage.setItem('email_sent', false);

  console.log("End of main function");
  
});

function compose_email(event, recipients, subject, timestamp) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out or populate composition fields
  if (recipients) {
    document.querySelector('#compose-recipients').value = recipients;  
  } else {
    document.querySelector('#compose-recipients').value = '';  
  }
  if (subject){
    document.querySelector('#compose-subject').value = 'Re: ' + subject;
  } else {
    document.querySelector('#compose-subject').value = '';
  }
  if (timestamp) {
    document.querySelector('#compose-body').value = `On ${timestamp} ${recipients} wrote:`;
  } else {
    document.querySelector('#compose-body').value = '';
  }
  
  // Send email when the submit button is pushed
  document.querySelector('#submit').addEventListener('click', send_email);
}

function view_email(email_id) {

    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Clear the view
    while (document.querySelector('#email-view').firstChild) {
      document.querySelector('#email-view').removeChild(document.querySelector('#email-view').firstChild)
    }

    // Get email
    fetch(`/emails/${email_id}`, {
      method: 'GET'
    })
    .then(response => response.json())
    // Use the received data when it is there
    .then(data => {
      console.log(`Recuperado email con id: ${email_id}`);
      console.log(data);
  
      var email = data;

    // Show email
    sender = document.createElement('p');
    sender.innerHTML = email.sender;
    body = document.createElement('p');
    body.innerHTML = email.body;
    timestamp = document.createElement('p');
    timestamp.innerHTML = email.timestamp;

    document.querySelector('#email-view').appendChild(sender);
    document.querySelector('#email-view').appendChild(body);
    document.querySelector('#email-view').appendChild(timestamp);

    // Mark email as read
    console.log("Marcando email leído...");
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })

    // Archive buttons
    // Archive email
    if (email.archived == false) {
      archive_button = document.createElement('button');
      archive_button.innerHTML = "Archive";
      archive_button.classList = "btn btn-sm btn-outline-primary mt-3";
      document.querySelector('#email-view').appendChild(archive_button);
      archive_button.addEventListener('click', () => {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      load_mailbox('inbox');
    })
    }
    // Unarchive 
    else {
      archive_button = document.createElement('button');
      archive_button.innerHTML = "Unarchive";
      archive_button.classList = "btn btn-sm btn-outline-primary m-1";
      document.querySelector('#email-view').appendChild(archive_button);
      archive_button.addEventListener('click', () => {
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      load_mailbox('inbox');
    })
    }

    // Reply button
    // Show reply button
    reply_button = document.createElement('button');
    reply_button.innerHTML = "Reply";
    reply_button.classList = "btn btn-sm btn-outline-primary m-1";
    document.querySelector('#email-view').appendChild(reply_button);
    reply_button.addEventListener('click', function(event) {
      // Go to compose view
      compose_email(event, email.recipients, email.subject, email.timestamp);
    });
  });
}

function load_mailbox(mailbox) {

  console.log(`In function load_mailbox. Mailbox: ${mailbox}`);
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3 id="inbox-header">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Get the emails via API
  fetch(`/emails/${mailbox}`, {
    method: 'GET'
  })
  .then(response => response.json())
  // Use the received data when it is there
  .then(data => {
    console.log(`Lista de emails en ${mailbox}`);
    console.log(data);

    const emails = data;
    
    // Show mailbox messages
    var email_boxes = []
    for (let i = 0; i < emails.length; i++) {

      email_boxes[i] = document.createElement('div');
      email_boxes[i].id = `email_boxes_${i}`;
      email_boxes[i].classList.add('border');
      email_boxes[i].classList.add('p-2');
      email_boxes[i].addEventListener('click', () => {view_email(emails[i].id)});
      document.querySelector('#inbox-header').appendChild(email_boxes[i]);

      const sender = document.createElement('h5');
      const subject = document.createElement('h5');
      const datetime = document.createElement('h6');
      // Style the div email container
      if (emails[i].read === true) {
        email_boxes[i].style.backgroundColor = 'lightgray';
      }

      sender.innerHTML = emails[i].sender;
      subject.innerHTML = emails[i].subject;
      datetime.innerHTML = emails[i].timestamp;

      document.querySelector(`#email_boxes_${i}`).appendChild(sender);
      document.querySelector(`#email_boxes_${i}`).appendChild(subject);
      document.querySelector(`#email_boxes_${i}`).appendChild(datetime);  
    }
    
  });

}

function send_email() {
  // Get form values
  let from = document.getElementById('compose-from').value;
  let recipients = document.getElementById('compose-recipients').value;
  let subject = document.getElementById('compose-subject').value;
  let body = document.getElementById('compose-body').value;

  console.log(`From: ${from}`);
  console.log(recipients);
  console.log(subject);
  console.log(body);

  // Send email via API
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: `${recipients}`,
      subject:    `${subject}`,
      body:       `${body}`,
    })
  })
  .catch(error => {
    console.log(error);
  })
  .then(response => response.json())
  .then(result => {
    console.log(result);
    console.log("Message sent");
  });

  console.log('Ending send_mail funcion...');
  localStorage.setItem('email_sent', true);

}