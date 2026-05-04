div className=topbar
  div className=container topbar-inner
    Link href= className=brandTravelBridgeLink

    div className=nav
      Link href= className=nav-linkHomeLink
      Link href=bookingbookings className=nav-linkMy BookingsLink

      div className=nav-auth
        {isAuthenticated  (
          
            span className=user-pillHi, {user.name  'User'}span
            button className=btn btn-outline onClick={logout}Logoutbutton
          
        )  (
          
            Link href=login className=nav-linkLoginLink
            Link href=signup className=btn btn-primarySign upLink
          
        )}
      div
    div
  div
div