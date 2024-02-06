document.addEventListener('DOMContentLoaded', function () {
    // Use buttons to toggle between views
    document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
    document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
    document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
    document.querySelector('#compose').addEventListener('click', compose_email);

    document.querySelector('#compose-form').addEventListener('submit', compose_submit);

    // By default, load the inbox
    load_mailbox('inbox');
});

function compose_email() {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#email-view').style.display = 'none';

    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
}

function compose_submit(event) {
    event.preventDefault();

    const compose_recipients = document.querySelector('#compose-recipients').value;
    const compose_subject = document.querySelector('#compose-subject').value;
    const compose_body = document.querySelector('#compose-body').value;


    fetch('/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',

        },
        body: JSON.stringify({
            recipients: compose_recipients,
            subject: compose_subject,
            body: compose_body,
        }),
    })
        .then(response => response.json())
        .then(result => {
            load_mailbox('sent');
        })
        .catch(error => console.error('Error composing email:', error));
}

function load_mailbox(mailbox) {

    document.querySelector('#emails-view').innerHTML = '';

    fetch(`/emails/${mailbox}`)
        .then(response => response.json())
        .then(emails => {

            for (let i of Object.keys(emails)) {
                const detail_email = document.createElement('div');
                detail_email.classList.add('email');
                if (emails[i].read) {
                    detail_email.classList.add('is_read');
                }

                detail_email.innerHTML = `
                    <div id='subject'><a href= "#email-view" onclick="load_email(${emails[i].id}, '${mailbox}')">Subject    : ${emails[i].subject}</a></div>
                    <div> Sender: ${emails[i].sender}</div>
                    <div> Date: ${emails[i].timestamp}</div>
                `;

                document.querySelector('#emails-view').append(detail_email);
            }
        })
        .catch(error => {
            console.error('Error fetching emails:', error);

        });


    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
}

function load_email(id, mailbox) {
    const item = (mailbox === "inbox");
    console.log('Email ID:', id);

    document.querySelector('#email-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';

    // Mark the email as read
    fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true,
        }),
    })
    .catch(error => console.error('Error marking email as read:', error));

    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);


        const emailView = document.querySelector('#email-view');
        emailView.innerHTML = `
            <div>From: ${email.sender}</div>
            <div>To: ${email.recipients}</div>
            <div>Subject: ${email.subject}</div>
            <div>Timestamp: ${email.timestamp}</div>
            <div class="email-buttons">
                <button class="btn-email" id="reply">Reply</button>
                <button class="btn-email" id="arch">Archived</button>
            </div>
            <hr>
            <div id='body'>
                <h4>${email.subject}</h4>
                ${email.body}
            </div>
        `;

        document.querySelector('#arch').addEventListener('click', () => {
            fetch(`/emails/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',

                },
                body: JSON.stringify({
                    archived: true,
                }),
            })
            fetch(`/emails/${id}`)
            .then(response => response.json())
            .then(arch => {
                console.log('Email archived successfully:', arch);
                load_mailbox('archive');
            })
            .catch(error => console.error('Error updating email archive status:', error));
        });

        document.querySelector('#reply').addEventListener('click', () => {
            compose_email();
            document.querySelector('#compose-recipients').value = email.sender;

            if (!email.subject.startsWith('Re: ')) {
                document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
            } else {
                document.querySelector('#compose-subject').value = email.subject;
            }

            document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote:${email.body}`;
        });
    })
    .catch(error => console.error('Error fetching email details:', error));
}

