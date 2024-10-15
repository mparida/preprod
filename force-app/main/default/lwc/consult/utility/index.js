const enablementOfConferenceSession = (component, payload) => {
    const {who ,mode} = payload;

    if (who === 'System' && (mode === 'conference' || mode==='chat') ) {
        component.props.disableOngoingConsultRequest();
    }
      
}


export {enablementOfConferenceSession}