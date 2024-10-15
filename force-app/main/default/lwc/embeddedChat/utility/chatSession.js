export const enableCoachSession = (component, isCoaching) =>
{
    const isTwoWayCoaching = component.twoWayCoachingMode;
    if (isTwoWayCoaching)
    {
        //component.handleCloseLeaveReason(); attc-372
        //component.cancelProfanity();attc-372

        if (isCoaching) 
        {
            if(!component.isSupervisorSession) {
                component.isSupervisorSession = true;
                component.isActiveChatForSupervisor = true; 
                
            }
            component.props.enableOngoingConsultRequest();
        }
        else
        {
            component.isSupervisorSession = false;
        }
    }
}
export const getSupervisorName = (component, payload) => {
        const supervisorName = payload.who;
        component.supervisorName = supervisorName;
    
}


export const activateCustomerOrSupervisorButton = (comp, payload) =>
{

    if(comp.isSupervisorSession && payload.classes !== 'Agent Me') {
        if(payload.destination === 'All') {
            comp.toggleCustomerButton();
        }else {
            comp.toggleSupervisorButton();
        }
    }

}