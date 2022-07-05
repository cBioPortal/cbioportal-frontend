import React from 'react'
import ReactMarkdown from 'react-markdown';


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
       <ReactMarkdown children='# Welcome to cbioportal Markdown example' />
    ),
},
];