colima:
	@echo "system is : $(OS)"
ifeq ($(COLIMA), true)
	colima start --arch aarch64 --mount $(PROJECT_PATH):w --vm-type vz
endif
