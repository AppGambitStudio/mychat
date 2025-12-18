(function () {
    const script = document.currentScript;
    const chatSpaceSlug = script.getAttribute('data-chat-space');

    // Auto-detect backend URL from the script source
    // src="https://api.example.com/widget.js" -> backendUrl="https://api.example.com"
    const src = script.src;
    const backendUrl = src.substring(0, src.lastIndexOf('/'));

    // Fallback if something goes wrong (though script.src should always exist)
    if (!backendUrl) {
        console.error('MyChat: Could not detect backend URL');
        return;
    }

    if (!chatSpaceSlug) {
        console.error('MyChat: data-chat-space attribute is missing');
        return;
    }

    // Create container
    const container = document.createElement('div');
    container.id = 'mychat-widget-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.fontFamily = "'TikTok Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    document.body.appendChild(container);

    // Icons
    const chatIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const closeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    // Create toggle button
    const button = document.createElement('button');
    button.innerHTML = chatIcon;
    button.style.backgroundColor = '#3B82F6';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '50%';
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    button.style.display = 'flex';
    button.style.alignItems = 'center';
    button.style.justifyContent = 'center';
    button.style.transition = 'transform 0.2s';
    container.appendChild(button);

    // Create chat window (hidden by default)
    const chatWindow = document.createElement('div');
    chatWindow.style.display = 'none';
    chatWindow.style.position = 'absolute';
    chatWindow.style.bottom = '80px';
    chatWindow.style.right = '0';
    chatWindow.style.width = '350px'; // Default
    chatWindow.style.maxWidth = '90vw'; // Responsive mobile safety
    chatWindow.style.height = '500px';
    chatWindow.style.maxHeight = '80vh';
    chatWindow.style.backgroundColor = 'white';
    chatWindow.style.borderRadius = '10px';
    chatWindow.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
    chatWindow.style.flexDirection = 'column';
    chatWindow.style.overflow = 'hidden';
    container.appendChild(chatWindow);

    // Chat Header
    const header = document.createElement('div');
    header.style.padding = '15px';
    header.style.backgroundColor = '#3B82F6';
    header.style.color = 'white';
    header.style.fontWeight = 'bold';
    header.innerHTML = 'MyChat Assistant'; // Default title
    chatWindow.appendChild(header);

    // Generate Anonymous ID
    let anonymousId = localStorage.getItem('mychat_anonymous_id');
    if (!anonymousId) {
        anonymousId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
        localStorage.setItem('mychat_anonymous_id', anonymousId);
    }

    // Fetch Config
    fetch(`${backendUrl}/api/widget/${chatSpaceSlug}/config`)
        .then(res => res.json())
        .then(data => {
            if (data.name) {
                header.innerHTML = `MyChat Assistant - ${data.name}`;
            }

            // Apply Widget Config
            const config = data.widget_config || {};

            // 1. Position
            const pos = config.position || 'bottom-right';
            container.style.bottom = '';
            container.style.top = '';
            container.style.left = '';
            container.style.right = '';

            // Reset Chat Window Pos
            chatWindow.style.bottom = '';
            chatWindow.style.top = '';
            chatWindow.style.left = '';
            chatWindow.style.right = '';

            if (pos === 'bottom-right') {
                container.style.bottom = '20px';
                container.style.right = '20px';
                chatWindow.style.bottom = '80px';
                chatWindow.style.right = '0';
            } else if (pos === 'bottom-left') {
                container.style.bottom = '20px';
                container.style.left = '20px';
                chatWindow.style.bottom = '80px';
                chatWindow.style.left = '0';
            } else if (pos === 'bottom-center') {
                container.style.bottom = '20px';
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)'; // Only for container, might affect button rotation
                // Fix transform conflict with button rotation?
                // Actually container doesn't rotate. Button rotates.
                // But container transform creates a new stacking context.

                chatWindow.style.bottom = '80px';
                chatWindow.style.left = '50%';
                chatWindow.style.transform = 'translateX(-50%)';
            } else if (pos === 'top-right') {
                container.style.top = '20px';
                container.style.right = '20px';
                chatWindow.style.top = '80px';
                chatWindow.style.right = '0';
            } else if (pos === 'top-left') {
                container.style.top = '20px';
                container.style.left = '20px';
                chatWindow.style.top = '80px';
                chatWindow.style.left = '0';
            } else if (pos === 'top-center') {
                container.style.top = '20px';
                container.style.left = '50%';
                container.style.transform = 'translateX(-50%)';
                chatWindow.style.top = '80px';
                chatWindow.style.left = '50%';
                chatWindow.style.transform = 'translateX(-50%)';
            }

            // 2. Launcher Style
            if (config.launcherType === 'text') {
                button.style.width = 'auto';
                button.style.borderRadius = '30px';
                button.style.padding = '0 20px';

                const textSpan = document.createElement('span');
                textSpan.innerText = config.launcherText || 'Chat';
                textSpan.style.marginLeft = '10px';
                textSpan.style.fontWeight = '600';
                textSpan.style.whiteSpace = 'nowrap';

                // When open, we might want to hide text or keep it?
                // Standard behavior: turn into close icon (round).
                // Or keep pill? Let's check user request. "Chat Button with custom text".
                // Usually it turns into close icon.
                // Let's store the original content.
                button.setAttribute('data-text', config.launcherText || 'Chat');

                // Add text to button initially
                button.appendChild(textSpan);
            }

            // 3. Window Width
            const widthMap = {
                'small': '350px',
                'medium': '450px',
                'large': '550px'
            };
            const width = widthMap[config.width] || '350px';
            chatWindow.style.width = width;

            // Track Load
            if (data.id) {
                fetch(`${backendUrl}/api/analytics/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_space_id: data.id,
                        event_type: 'widget_load',
                        anonymous_id: anonymousId
                    })
                }).catch(e => console.error('Analytics error', e));
            }

            // Handle Status
            if (data.status === 'testing') {
                const badge = document.createElement('span');
                badge.innerText = 'TEST MODE';
                badge.style.backgroundColor = '#F59E0B'; // Amber
                badge.style.color = 'white';
                badge.style.fontSize = '10px';
                badge.style.padding = '2px 6px';
                badge.style.borderRadius = '4px';
                badge.style.marginLeft = '10px';
                badge.style.verticalAlign = 'middle';
                header.appendChild(badge);
            } else if (data.status === 'maintenance') {
                // Hide input area
                inputArea.style.display = 'none';

                // Show maintenance message
                messagesArea.innerHTML = ''; // Clear messages
                const maintenanceDiv = document.createElement('div');
                maintenanceDiv.style.height = '100%';
                maintenanceDiv.style.display = 'flex';
                maintenanceDiv.style.flexDirection = 'column';
                maintenanceDiv.style.alignItems = 'center';
                maintenanceDiv.style.justifyContent = 'center';
                maintenanceDiv.style.color = '#6B7280';
                maintenanceDiv.style.textAlign = 'center';

                maintenanceDiv.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    <h3 style="margin: 0; font-weight: bold;">Under Maintenance</h3>
                    <p style="margin: 5px 0 0 0; font-size: 14px;">We'll be back shortly.</p>
                `;
                messagesArea.appendChild(maintenanceDiv);
            }
        })
        .catch(err => console.error('Failed to load widget config:', err));

    // Messages Area
    const messagesArea = document.createElement('div');
    messagesArea.style.flex = '1';
    messagesArea.style.padding = '15px';
    messagesArea.style.overflowY = 'auto';
    messagesArea.style.backgroundColor = '#f3f4f6';
    chatWindow.appendChild(messagesArea);

    // Input Area
    const inputArea = document.createElement('div');
    inputArea.style.padding = '15px';
    inputArea.style.borderTop = '1px solid #e5e7eb';
    inputArea.style.display = 'flex';
    chatWindow.appendChild(inputArea);

    const input = document.createElement('input');
    input.style.flex = '1';
    input.style.padding = '8px';
    input.style.border = '1px solid #d1d5db';
    input.style.borderRadius = '4px';
    input.style.marginRight = '8px';
    input.placeholder = 'Type a message...';
    inputArea.appendChild(input);

    const sendBtn = document.createElement('button');
    sendBtn.innerHTML = 'Send';
    sendBtn.style.backgroundColor = '#3B82F6';
    sendBtn.style.color = 'white';
    sendBtn.style.border = 'none';
    sendBtn.style.borderRadius = '4px';
    sendBtn.style.padding = '8px 12px';
    sendBtn.style.cursor = 'pointer';
    inputArea.appendChild(sendBtn);

    // Toggle Logic
    let isOpen = false;
    button.onclick = () => {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? 'flex' : 'none';

        const configText = button.getAttribute('data-text');

        if (isOpen) {
            // Close State: Always show Close Icon, Round Button
            button.innerHTML = closeIcon;
            button.style.width = '60px'; // Revert to round
            button.style.borderRadius = '50%';
            button.style.padding = '0';
            button.style.transform = 'rotate(90deg)';
        } else {
            // Open State (Initial): Revert to config style
            button.style.transform = 'rotate(0deg)';
            button.innerHTML = chatIcon;

            if (configText) {
                button.style.width = 'auto'; // Pill
                button.style.borderRadius = '30px';
                button.style.padding = '0 20px';

                const textSpan = document.createElement('span');
                textSpan.innerText = configText;
                textSpan.style.marginLeft = '10px';
                textSpan.style.fontWeight = '600';
                textSpan.style.whiteSpace = 'nowrap';
                button.appendChild(textSpan);
            } else {
                button.style.width = '60px';
                button.style.borderRadius = '50%';
                button.style.padding = '0';
            }
        }
    };

    // Load TikTok Sans font
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=TikTok+Sans:opsz,wght@12..36,300..900&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Load marked.js for Markdown rendering
    const markedScript = document.createElement('script');
    markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    document.head.appendChild(markedScript);

    // Chat Logic
    const appendMessage = (role, text) => {
        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '10px';
        msgDiv.style.textAlign = role === 'user' ? 'right' : 'left';

        const bubble = document.createElement('div');
        bubble.style.display = 'inline-block';
        bubble.style.padding = '8px 12px';
        bubble.style.borderRadius = '8px';
        bubble.style.maxWidth = '80%';
        bubble.style.backgroundColor = role === 'user' ? '#3B82F6' : 'white';
        bubble.style.color = role === 'user' ? 'white' : 'black';
        bubble.style.textAlign = 'left'; // Ensure text aligns left even in bubble
        bubble.style.wordWrap = 'break-word'; // Prevent overflow

        if (role === 'assistant' && window.marked) {
            bubble.innerHTML = window.marked.parse(text);
            // Basic Markdown Styling within bubble
            const style = bubble.style;
            if (!document.getElementById('mychat-widget-styles')) {
                const styleSheet = document.createElement('style');
                styleSheet.id = 'mychat-widget-styles';
                styleSheet.textContent = `
                    #mychat-widget-container p { margin: 0 0 10px 0; }
                    #mychat-widget-container p:last-child { margin-bottom: 0; }
                    #mychat-widget-container ul, #mychat-widget-container ol { margin: 0 0 10px 0; padding-left: 20px; }
                    #mychat-widget-container code { background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace; }
                    #mychat-widget-container pre { background: #f4f4f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
                    #mychat-widget-container pre code { background: none; padding: 0; }
                    #mychat-widget-container a { color: #2563eb; text-decoration: underline; }
                `;
                document.head.appendChild(styleSheet);
            }
        } else {
            bubble.innerText = text;
        }

        msgDiv.appendChild(bubble);
        messagesArea.appendChild(msgDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    };

    const sendMessage = async () => {
        const text = input.value.trim();
        if (!text) return;

        appendMessage('user', text);
        input.value = '';

        try {
            const res = await fetch(`${backendUrl}/api/widget/${chatSpaceSlug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();
            if (data.message) {
                appendMessage('assistant', data.message.content);
            }
        } catch (error) {
            console.error('Chat error:', error);
            appendMessage('assistant', 'Sorry, something went wrong.');
        }
    };

    sendBtn.onclick = sendMessage;
    input.onkeypress = (e) => {
        if (e.key === 'Enter') sendMessage();
    };

    // Powered By Footer
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.fontSize = '10px';
    footer.style.color = '#9ca3af';
    footer.style.padding = '8px';
    footer.style.backgroundColor = '#f9fafb';
    footer.style.borderTop = '1px solid #e5e7eb';
    footer.innerHTML = 'Powered by <strong>APPGAMBiT MyChat</strong>';
    chatWindow.appendChild(footer);

})();
