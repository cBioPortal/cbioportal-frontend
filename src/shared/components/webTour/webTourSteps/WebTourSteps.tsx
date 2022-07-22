import React, { useContext } from 'react'


// const data = useContext(TourContext)
export const HomePageTour  = [
  {
    selector: '[data-tut="reactour__start"]',
      content: () => (
          <div className="step">
              Welcome to the <b>cBioPortal Guided Tour</b>!
              <p />
              Lets get you oriented.
              <p />
              To follow along, click the next buttons below.
          </div>
      ),
  },
  {
      selector: '[data-tut = "exploreSelectedStudies"]',
      content: () => (
          <div className="step">
              Or, you can:
              <p />
              <b>Explore Selected Studies</b>: in this mode, you will jump
              directly to our study view page.
              <p />
              You can then get a bird's eye view of all genomic and
              clinical data within the selected study.
          </div>
      ),
  },
  {
      selector: '[data-tut="cancerStudyListContainer"]',
      content: () => (
          <div className="step">
              You can then select one of more cancer studies.
              <br />
              <br />
              For beginners, we suggest you select just one cancer study
              to start.
          </div>
      ),
  },
  {
      selector: '[data-tut="tour_selector_0"]',
      content: () => {
        
        return (

          <div className="step">
              Move ahead with selected this one.
              <br />
          </div>
        )
      }
      ,
stepInteraction: true,
action: (node:any) => {
  const nextBtn:any = document.getElementById("_tour_next_btn");
  // by using this, focus trap is temporary disabled
  
  node.focus();
  node.onclick = () => {
    // nextBtn.click();
    // ...
  };
}
  },
  {
      selector: '[data-tut="tour_selector_1"]',
      content: () => (
          <div className="step">
              And now this one.
              <br />
          </div>
      ),
stepInteraction: true,

action: (node:any) => {
  const nextBtn:any = document.getElementById("_tour_next_btn");
  // by using this, focus trap is temporary disabled
  node.focus();
  node.onclick = () => {
    nextBtn.click();
    
    // ...
  };
}
  },
  {
    selector: '[data-tut="reactour__queryByGene"]',
    content: () => (
                 <div className="step">
                     Now, you have two options:
                     <p />
                     You can either:
                     <p />
                     <b>Query by Gene</b>: in this mode, you will be prompted to
                     enter one of more genes.
                     <p />
                     You can then analyze these genes within the selected study.
                 </div>
      
      ),
stepInteraction: true,
action: (node:any) => {
  const nextBtn:any = document.getElementById("_tour_next_btn");
  // by using this, focus trap is temporary disabled
  node.focus();
  node.onclick = () => {
    nextBtn.click();

    // ...
  };
}
  },
  {
      selector:  '[data-tut="cancerStudyListContainer_reactmarkdown"]',
      content: () => (
          <div className="step">
              To get started, you can select a cancer type from the{' '}
              <b>left navigation pane</b>.
              <p />
              For example, if you are interested in Glioblastoma, click
              CNS/Brain.
          </div>
      ),
  },
  {
    selector : '#mid_page',
    // selector:  '[data-tut="cancerStudyListContainer_reactmarkdown"]',
    content: () => (
       <div> Welcome to cbioportal Markdown example' </div>
    ),
},
];

export const genomicDataTour = [
  {
    selector : '[data-tut="genome_pie"]',
    content: () => (
      <div>Guide through genome studies. Click on the button highlighted !!!</div>
    )
  }
  ,{

    selector : '[data-tut="genome_TP53"]',
    content: () => (
      <div>Tour Through Routing</div>
    )
  }
  ,{

    selector : '[data-tut="genome_KRAS"]',
    content: () => (
      <div>Step 3!!!</div>
    )
  }
]