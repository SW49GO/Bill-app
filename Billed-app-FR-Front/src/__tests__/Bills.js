/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import Logout from "../containers/Logout";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import { bills } from "../fixtures/bills"
import router from "../app/Router"
import $ from 'jquery';

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Simulation of localStorage
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression  // Result for icon highlighted
      expect(windowIcon.classList.contains("active-icon")).toBe(true);  
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  describe("When I click on the 'New Bill' button",()=>{
    test("Then I am directed to the NewBill page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // Simulation function
      const handleClickNewBill = jest.fn();
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      buttonNewBill.addEventListener('click', handleClickNewBill)
      userEvent.click(buttonNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
      // Result I am on NewBill Page
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
})

describe("Given I am connected as an employee, I am on Bill page", () => {
  describe("When I click on the 'Back' button of the browser",()=>{
    test("Then I stay on Bills page",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const PREVIOUS_LOCATION ='/';
      window.onpopstate = () => {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user) {
          onNavigate(PREVIOUS_LOCATION)
        }
      }
      window.onpopstate()
        // Result I stay on Bills page
      expect(document.body.innerHTML).toContain('Mes notes de frais')
    })
  })

  describe("When I click on the iconEye of one of the bills",()=>{
    test("Then A modal opens displaying the Proof of the bill",()=>{
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // Simulation of the "modal" method of the JQuery library
      $.fn.modal = jest.fn()
      const handleClickIconEye = jest.fn()
      const iconEyes = screen.getAllByTestId("icon-eye")
      if (iconEyes.length > 0) {
        const firstIconEyes = iconEyes[0]
        firstIconEyes.addEventListener("click", () => handleClickIconEye(firstIconEyes))
        userEvent.click(firstIconEyes)
        expect(handleClickIconEye).toHaveBeenCalled()
        expect($.fn.modal).toHaveBeenCalled()
      }
      // Result the modal is open
      expect(screen.getByText("Justificatif")).toBeTruthy()

      //[Big Hunt] -Bills - Modal must show image
      const imgElement = document.querySelector('img')
      expect(imgElement).toBeTruthy()
      expect(imgElement.src).not.toBe(null)
      expect(imgElement.src.match(/\.(jpg|jpeg|png)/)).toBeTruthy()
    })
  })
  describe("When I click on disconnect Button",()=>{
    test("Then I am redirected to the 'Login' page",()=>{
      // Simulation of navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      document.body.innerHTML = BillsUI({data:bills})
      // Spy function on browser localStorage getItem calls
      const getItemSpy = jest.spyOn(global.window.localStorage, 'getItem')
      // Return JSON string {"type": "Employee"} on every call to getItem
      getItemSpy.mockReturnValue(JSON.stringify({ type: 'Employee' }))
      
      new Logout({ document, onNavigate, localStorage })
      // Select ID
      const disconnect =  $('#layout-disconnect')
      // Triggering the Click
      disconnect.trigger('click')
      // Result I am on Login Page
      expect(screen.getByText("Employé")).toBeTruthy() 
    })
  })
})

describe("Given I am connected as an employee, on Bills Page, and I click on EyeIcon",()=>{
  describe("When I click on the closing 'Cross'",()=>{
    test("Then the modal disappear",()=>{
      document.body.innerHTML=BillsUI({data:bills})
      $.fn.modal = jest.fn()
      const handleClickIconEye = jest.fn()
      const firstIconEyes = screen.getAllByTestId("icon-eye")[0]
      firstIconEyes.addEventListener("click", () => handleClickIconEye(firstIconEyes))
      fireEvent.click(firstIconEyes)

      const modalClose = document.body.querySelector('.close')
      const clickHandlerClose = jest.fn()
      modalClose.addEventListener('click', clickHandlerClose)
      userEvent.click(modalClose)
      const modalContainer = document.body.querySelector('.modal')
      // Result the modal class "show" disappear
      expect(modalContainer.classList.contains('show')).toBeFalsy()
    })
  })
})


///////////////////////////////////////////////////////////////////////////
//////                  INTEGRATION TEST GET                      /////////
///////////////////////////////////////////////////////////////////////////

describe("Given I am a user connected as Employee",()=>{
  describe("When I navigate to Bills",()=>{
    test("Then fetches bills from mock API GET",async()=>{
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBills = new Bills({ document, onNavigate, store:mockStore, localStorage:localStorageMock })
      // Simulation function for getBills method
      const getBillsMock = jest.fn(()=>newBills.getBills())
      const listBills = await getBillsMock()
      expect(getBillsMock).toHaveBeenCalled()
      // Result 4 bills render
      expect(listBills.length).toBe(4)

      await waitFor(() => screen.getAllByText("Mes notes de frais"))
      expect(screen.getByText("Nouvelle note de frais")).toBeTruthy()
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy()
      expect(screen.getByText("Services en ligne")).toBeTruthy()
      expect(screen.getByText("100 €")).toBeTruthy()
      expect(screen.getByText("Billed")).toBeTruthy()
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Spy function bills of mockStore
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "a@a"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 400 message error", async () => {
      //Erreur 400 (Bad Request) syntax request, ressource not found, bad URL
      // Custom implementation of the bills method that will only be executed once
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 400"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      // The code is suspended until the promise is resolved
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 400/)
      // Result message correct
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 401 message error", async () => {
      //Erreur 401 (Unauthorized)
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 401"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 401/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      //Erreur 404 (Not Found) ressource not found
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches bills from an API and fails with 500 message error", async () => {
      //Erreur 500 (Internal Server Error) 
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})


  ///////////////////////////////////////////////////////////////////////////////
  ////                               COVERAGE                                ////
  ///////////////////////////////////////////////////////////////////////////////

  //   // COVERAGE : getBills -> catch(e){  console.log(e,'for',doc)...
  describe("Given  I am a user connected as Employee",()=>{
    describe("When I'm on the bills page with corrupted data", () => {
      test("Then It should render a log error", async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const allBills = new Bills({document, onNavigate,store: mockStore,localStorage: window.localStorage });
        // Configuration list method return value once
        mockStore.bills().list = jest.fn().mockResolvedValueOnce([
          { doc: { date: '2023-05-01', status: 'accepted' } },
          { doc: { date: '2023-06-01', status: 'accepted' } },
          { doc: { date: '2023-05-02', status: 'accepted' } },
          { doc: { date: 'incorrect date', status: 'rejected' } },
          { doc: { date: '2023-05-04', status: undefined } }, 
        ]);

        const consoleSpy = jest.spyOn(console, 'log')
        const newListBills = await allBills.getBills()
  
        await expect(mockStore.bills().list).toHaveBeenCalled()
        // Result correct for render
        expect(newListBills.length).toBe(5) 
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error), expect.stringContaining("for"), expect.objectContaining({ doc: { date: "incorrect date", status: "rejected" } }))
        // Restore the console.log
        consoleSpy.mockRestore()
      })
    })
  })