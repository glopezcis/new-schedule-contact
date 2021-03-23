# New Schedule Contact Component

New Schedule Contact component for SmartTracker App

## Install
```bash
npm i --save @glopezcis/new-schedule-contact
```
## Usage
 ```jsx
 import React from "react";

 import NewScheduleContact from "@glopezcis/new-schedule-contact";

 const Example = () => {
   return
      <NewScheduleContact 
         agencydata={agencyData}
         allCarriers={allCarriers}
         queue={queueById}
         uploadFileToS3={uploadFileToS3}
         messageType={messageType}
      />
    );
 }
 ```
 ## Props
| Name                        | 
| --------------------------- |
| `agencyData`    (required)  |
| `allCarriers`   (required)  |
| `queue`         (required)  |
| `uploadFileToS3`            |
| `messageType`   (required)  | 
