// This script will be injected into the HSCAP page to perform the search.

async function findStudent() {
  const TARGET_NAME = 'ANAMIKA';
  console.log(`Starting search for ${TARGET_NAME}`);

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const schoolDropdown = document.querySelector('select[name="school"]');
  if (!schoolDropdown) {
    alert('Error: School dropdown not found. Make sure you are on the correct page and have selected a district.');
    return;
  }

  const schoolOptions = Array.from(schoolDropdown.options).filter(opt => opt.value !== '');

  for (const schoolOption of schoolOptions) {
    const schoolName = schoolOption.text;
    console.log(`Searching School: ${schoolName}`);
    
    // Select the school
    schoolDropdown.value = schoolOption.value;
    await delay(1000); // Wait for courses to load

    const courseDropdown = document.querySelector('select[name="course"]');
    const courseOptions = Array.from(courseDropdown.options).filter(opt => opt.value !== '');

    for (const courseOption of courseOptions) {
      const courseName = courseOption.text;
      
      // Select the course
      courseDropdown.value = courseOption.value;
      
      // Find and click the submit button
      document.querySelector('input[type="submit"]').click();

      // Wait for the results page to load
      await delay(2000); 

      if (document.body.innerText.toUpperCase().includes(TARGET_NAME)) {
        alert(`🎉 SUCCESS! Found ${TARGET_NAME}\n\nSchool: ${schoolName}\nCourse: ${courseName}`);
        console.log(`Found at School: ${schoolName}, Course: ${courseName}`);
        return; // Stop the script
      }

      // Go back to the form page
      history.back();
      await delay(2000); // Wait for the form page to reload
    }
  }

  alert(`Search complete. ${TARGET_NAME} was not found.`);
  console.log('Search finished. Name not found.');
}

findStudent();