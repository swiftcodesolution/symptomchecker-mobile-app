export const medicalHistorySections = [
    {
      title: "Personal Information",
      data: [
        { id: "fullName", type: "text", label: "Full Name:", placeholder: "Enter your full name", required: true },
        { id: "dob", type: "date", label: "Date of Birth (MM/DD/YYYY):", placeholder: "MM/DD/YYYY", required: true },
        { id: "age", type: "number", label: "Age:", placeholder: "Enter your age" },
        { id: "gender", type: "text", label: "Gender (Male/Female/Other):", placeholder: "Enter your gender" },
        { id: "ethnicity", type: "text", label: "Ethnicity:", placeholder: "Enter your ethnicity" },
        { id: "address", type: "text", label: "Home Address:", placeholder: "Enter your address" },
        { id: "city", type: "text", label: "City:", placeholder: "Enter your city" },
        { id: "state", type: "text", label: "State:", placeholder: "Enter your state" },
        { id: "zip", type: "text", label: "Zip Code:", placeholder: "Enter your zip code" },
        { id: "phone", type: "phone", label: "Phone Number:", placeholder: "Enter your phone number", required: true },
        { id: "email", type: "email", label: "Email Address:", placeholder: "Enter your email" },
        { id: "height", type: "text", label: "Height (ft/in):", placeholder: "e.g. 5'9\"" },
        { id: "weight", type: "number", label: "Weight (lbs):", placeholder: "Enter your weight" },
      ]
    },
    {
      title: "Medical History",
      data: [
        { 
          id: "bloodGroup", 
          type: "text", 
          label: "Blood Group:", 
          placeholder: "e.g., O+, A-, B+" 
        },
        { 
          id: "surgeries", 
          type: "yesno", 
          label: "Have you had any surgeries in the past?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "hospitalized", 
          type: "yesno", 
          label: "Have you ever been hospitalized?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "bloodPressure", 
          type: "yesno", 
          label: "Do you have high blood pressure?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "diabetes", 
          type: "yesno", 
          label: "Do you have diabetes?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "heartDisease", 
          type: "yesno", 
          label: "Do you have heart disease?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "allergies", 
          type: "yesno", 
          label: "Do you have any known allergies?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "smoke", 
          type: "yesno", 
          label: "Do you currently smoke tobacco?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "alcohol", 
          type: "yesno", 
          label: "Do you consume alcohol?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "drugs", 
          type: "yesno", 
          label: "Do you use recreational drugs?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "weightChanges", 
          type: "yesno", 
          label: "Have you experienced any recent weight changes?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "fever", 
          type: "yesno", 
          label: "Have you had a fever in the past month?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "cancer", 
          type: "yesno", 
          label: "Do you have a history of cancer?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
        { 
          id: "familyHistory", 
          type: "yesno", 
          label: "Is there any family history of serious illness (e.g., cancer, heart disease)?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please explain:" 
          } 
        },
      ]
    },
    {
      title: "Current Medications",
      data: [
        { 
          id: "medications", 
          type: "multiline", 
          label: "Please list all current medications you are taking, including dosage and frequency:", 
          placeholder: "List each medication on a new line" 
        },
      ]
    },
    {
      title: "Past Surgeries",
      data: [
        { 
          id: "pastSurgeries", 
          type: "multiline", 
          label: "Please list all past surgeries, including the date and reason for each:", 
          placeholder: "List each surgery on a new line" 
        },
      ]
    },
    {
      title: "Additional Health Information",
      data: [
        { 
          id: "additionalInfo", 
          type: "multiline", 
          label: "Please use the space below to provide any additional health information or concerns:", 
          placeholder: "Enter any additional information" 
        },
      ]
    },
    {
      title: "Insurance Information",
      data: [
        { id: "insuranceProvider", type: "text", label: "Primary Insurance Provider:", placeholder: "Enter insurance provider" },
        { id: "policyNumber", type: "text", label: "Policy Number:", placeholder: "Enter policy number" },
        { id: "groupNumber", type: "text", label: "Group Number:", placeholder: "Enter group number" },
        { id: "subscriberName", type: "text", label: "Subscriber Name:", placeholder: "Enter subscriber name" },
        { id: "subscriberRelationship", type: "text", label: "Relationship to Patient:", placeholder: "Enter relationship" },
        { id: "secondaryInsurance", type: "text", label: "Secondary Insurance Provider (if any):", placeholder: "Enter secondary insurance" },
        { id: "secondaryPolicy", type: "text", label: "Policy Number:", placeholder: "Enter policy number" },
        { id: "secondaryGroup", type: "text", label: "Group Number:", placeholder: "Enter group number" },
      ]
    },
    {
      title: "Emergency Contact Information",
      data: [
        { id: "emergencyName", type: "text", label: "Full Name:", placeholder: "Enter full name", required: true },
        { id: "emergencyRelationship", type: "text", label: "Relationship to Patient:", placeholder: "Enter relationship" },
        { id: "emergencyPhone", type: "phone", label: "Phone Number:", placeholder: "Enter phone number", required: true },
        { id: "emergencyAltPhone", type: "phone", label: "Alternate Phone Number:", placeholder: "Enter alternate phone" },
        { id: "emergencyAddress", type: "text", label: "Address:", placeholder: "Enter address" },
      ]
    },
    {
      title: "Immunization History",
      data: [
        { 
          id: "tetanus", 
          type: "yesno", 
          label: "Tetanus (Td or Tdap) in the last 10 years?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "flu", 
          type: "yesno", 
          label: "Influenza (Flu) vaccine within the past year?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "covid", 
          type: "yesno", 
          label: "COVID-19 vaccination?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "hepatitis", 
          type: "yesno", 
          label: "Hepatitis B vaccine?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "mmr", 
          type: "yesno", 
          label: "MMR (Measles, Mumps, Rubella)?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "chickenpox", 
          type: "yesno", 
          label: "Chickenpox (Varicella)?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "pneumonia", 
          type: "yesno", 
          label: "Pneumonia vaccine?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
        { 
          id: "shingles", 
          type: "yesno", 
          label: "Shingles vaccine?", 
          followup: { 
            type: "text", 
            placeholder: "If yes, please provide date(s):" 
          } 
        },
      ]
    },
  ];